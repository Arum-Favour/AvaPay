import * as React from "react";
import Layout from "@/components/Layout";
import { 
  Building2, 
  Download, 
  Plus, 
  Wallet, 
  MoreVertical, 
  CircleDot,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Search,
  Users,
  Calendar,
  Zap,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import type { EmployerStateResponse } from "@shared/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWalletClient, useReadContracts } from "wagmi";
import { avalancheFuji } from "viem/chains";
import { formatUnits } from "viem";
import { avapayBatchPayrollAbi } from "@/lib/contracts/avapayBatchPayroll";
import { FUJI_USDC_ADDRESS } from "@shared/constants";

const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "balance", type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
] as const;

function formatUsdc(usdc6: number) {
  return (usdc6 / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Employer() {
  const { user } = useAuth();
  const { address: employerAddress } = useAccount();
  const qc = useQueryClient();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const treasuryUsdc = useReadContracts({
    contracts: employerAddress
      ? ([
          { address: FUJI_USDC_ADDRESS as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [employerAddress as `0x${string}`], chainId: avalancheFuji.id },
          { address: FUJI_USDC_ADDRESS as `0x${string}`, abi: erc20Abi, functionName: "decimals", chainId: avalancheFuji.id },
        ] as const)
      : ([] as const),
    query: { enabled: !!employerAddress },
  });
  const treasuryBalanceUsdc6 =
    treasuryUsdc.data?.[0]?.result != null && treasuryUsdc.data?.[1]?.result != null
      ? Number(formatUnits(treasuryUsdc.data[0].result as bigint, treasuryUsdc.data[1].result as number)) * 1_000_000
      : 0;

  const employerState = useQuery({
    queryKey: ["employer-state"],
    queryFn: async (): Promise<EmployerStateResponse> => {
      const res = await fetch("/api/employer/state", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load employer state");
      return res.json();
    },
    enabled: !!user,
  });

  const createEmployee = useMutation({
    mutationFn: async (input: { name: string; title?: string; wallet: string; monthlySalaryUsdc: string }) => {
      const monthlySalaryUsdc6 = Math.round(Number(input.monthlySalaryUsdc) * 1_000_000);
      const res = await fetch("/api/employer/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: input.name,
          title: input.title,
          wallet: input.wallet,
          monthlySalaryUsdc6,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to create employee");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Employee added");
      qc.invalidateQueries({ queryKey: ["employer-state"] });
    },
    onError: (e: any) => toast.error("Add employee failed", { description: e?.message ?? String(e) }),
  });

  const [newName, setNewName] = React.useState("");
  const [newTitle, setNewTitle] = React.useState("");
  const [newWallet, setNewWallet] = React.useState("");
  const [newSalary, setNewSalary] = React.useState("");

  const createPayrunDraft = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/employer/payruns/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to create payrun");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payrun draft created");
      qc.invalidateQueries({ queryKey: ["employer-state"] });
    },
    onError: (e: any) => toast.error("Create payrun failed", { description: e?.message ?? String(e) }),
  });

  const executeLatestDraft = useMutation({
    mutationFn: async () => {
      const state = employerState.data;
      if (!state) throw new Error("Employer state not loaded");
      if (!state.company.payrollContractAddress) throw new Error("No payroll contract set. Deploy one in Smart Contracts.");
      if (!walletClient) throw new Error("Connect wallet");

      const draft = [...state.payruns].find((p) => p.status === "draft");
      if (!draft) throw new Error("No draft payrun found. Create one first.");

      const recipients = state.employees.filter((e) => e.status === "active").map((e) => e.wallet as `0x${string}`);
      const amounts = state.employees.filter((e) => e.status === "active").map((e) => BigInt(e.monthlySalaryUsdc6));
      if (recipients.length === 0) throw new Error("No active employees to pay.");

      const hash = await walletClient.writeContract({
        chain: avalancheFuji,
        account: walletClient.account,
        address: state.company.payrollContractAddress as `0x${string}`,
        abi: avapayBatchPayrollAbi,
        functionName: "payBatch",
        args: [recipients, amounts],
      });

      await fetch("/api/employer/payruns/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payrunId: draft.id, txHash: hash }),
      }).catch(() => {});

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onSuccess: (hash) => {
      toast.success("Payrun executed", { description: hash });
      qc.invalidateQueries({ queryKey: ["employer-state"] });
    },
    onError: (e: any) => toast.error("Execution failed", { description: e?.message ?? String(e) }),
  });

  if (!user) return null;

  const companyName = employerState.data?.company?.name || "Your Company";
  const contractAddress = employerState.data?.company?.payrollContractAddress;
  const employees = employerState.data?.employees ?? [];
  const totalMonthly = employees.filter((e) => e.status === "active").reduce((acc, e) => acc + e.monthlySalaryUsdc6, 0);
  const treasuryDisplay =
    treasuryUsdc.isLoading
      ? "Loading…"
      : `${formatUsdc(Math.round(treasuryBalanceUsdc6))} USDC`;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Enterprise Dashboard</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-glow">{companyName}</h1>
            <p className="text-muted-foreground">Managing payroll infrastructure on Avalanche C-Chain.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={() => {
                const wallet = newWallet.trim();
                if (!wallet) return toast.error("Enter employee wallet");
                createEmployee.mutate({ name: newName, title: newTitle || undefined, wallet, monthlySalaryUsdc: newSalary });
              }}
              disabled={createEmployee.isPending}
              className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Plus className="mr-2 h-4 w-4" />
              {createEmployee.isPending ? "Adding..." : "Add Employee"}
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input placeholder="Employee name" className="rounded-xl bg-white/5 border-white/10" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Title (optional)" className="rounded-xl bg-white/5 border-white/10" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <Input placeholder="Wallet 0x..." className="rounded-xl bg-white/5 border-white/10 font-mono" value={newWallet} onChange={(e) => setNewWallet(e.target.value)} />
              <Input placeholder="Monthly salary (USDC)" type="number" className="rounded-xl bg-white/5 border-white/10" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} />
            </div>
            <div className="text-xs text-muted-foreground">
              Payroll contract:{" "}
              <span className="font-mono text-foreground">{contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : "Not set (deploy one in Smart Contracts)"}</span>
            </div>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
              onClick={() => createPayrunDraft.mutate()}
              disabled={createPayrunDraft.isPending}
            >
              {createPayrunDraft.isPending ? "Creating..." : "Create Payrun Draft"}
            </Button>
            <Button
              className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={() => executeLatestDraft.mutate()}
              disabled={executeLatestDraft.isPending}
            >
              <Zap className="mr-2 h-4 w-4" />
              {executeLatestDraft.isPending ? "Executing..." : "Execute Latest Draft On-chain"}
            </Button>
          </div>
        </div>

        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Treasury Balance */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-8 flex flex-col justify-between group hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Treasury Balance</h3>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-extrabold">{treasuryDisplay}</p>
                  <div className="flex items-center gap-1 text-emerald-500 text-sm font-bold pb-1">
                    <TrendingUp className="h-4 w-4" />
                    Your wallet
                  </div>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Wallet className="h-7 w-7" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Gas</span>
                <p className="text-sm font-bold">~0.15 AVAX</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Next Batch</span>
                <p className="text-sm font-bold">Create Payrun</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Multi-Sig Status</span>
                <div className="flex items-center justify-end gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-bold">1 of 1 (MVP)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Obligations Card */}
          <div className="glass-card rounded-2xl p-6 flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Upcoming Obligations</h3>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                Next 30 Days
              </Badge>
            </div>
            <div className="space-y-4 flex-1">
              {(employerState.data?.payruns ?? []).slice(0, 2).map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <Badge className={cn(
                      "text-[10px]",
                      p.status === "draft" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {p.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold mb-1">Payrun {p.id.slice(0, 8)}</p>
                  <p className="text-lg font-extrabold">${formatUsdc(p.totalAmountUsdc6)}</p>
                  {p.txHash ? (
                    <a
                      className="mt-2 block text-[10px] font-mono text-muted-foreground hover:text-primary truncate"
                      href={`https://testnet.snowtrace.io/tx/${p.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {p.txHash}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full text-xs text-muted-foreground group">
              View All Obligations
              <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Employee Directory Table */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-xl font-bold">Employee Directory</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage salary streams and payroll status for all team members.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, role, or wallet..." 
                className="pl-10 pr-4 py-2 w-full sm:w-[350px] rounded-full border-white/10 bg-white/5 focus-visible:ring-primary/50"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold">Employee</TableHead>
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold">Role</TableHead>
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold">Wallet Address</TableHead>
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold">Salary (Monthly)</TableHead>
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold">Status</TableHead>
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} className="border-white/5 hover:bg-white/5 transition-all">
                    <TableCell className="py-5 font-bold pl-8">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-[10px] text-white font-bold border border-white/10">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {employee.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-sm text-muted-foreground">{employee.title ?? "—"}</TableCell>
                    <TableCell className="py-5 font-mono text-[10px] text-muted-foreground">{employee.wallet}</TableCell>
                    <TableCell className="py-5 font-bold text-primary">${formatUsdc(employee.monthlySalaryUsdc6)}</TableCell>
                    <TableCell className="py-5">
                      <Badge className={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        employee.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                      )}>
                        {employee.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-white/10">
                          <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">View Details</DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">Edit Salary</DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">History</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 cursor-pointer">Pause Stream</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full border-white/10 bg-transparent h-8">Previous</Button>
              <Button variant="outline" size="sm" className="rounded-full border-white/10 bg-transparent h-8">Next</Button>
            </div>
            <span className="text-xs text-muted-foreground">Showing {employees.length} employee(s)</span>
          </div>
        </div>

        {/* Gas and Compliance Footer Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
          <div className="glass-card rounded-2xl p-6 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Real-time Gas Estimator</h4>
                <p className="text-xs text-muted-foreground">Current cost for batch payroll execution.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-accent">~$12.45</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">AvaFuji</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Compliance API Status</h4>
                <p className="text-xs text-muted-foreground">Institutional audit trail is active.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1">SECURED</Badge>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
