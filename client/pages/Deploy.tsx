import * as React from "react";
import Layout from "@/components/Layout";
import { 
  FileCode2, 
  Wallet, 
  DollarSign, 
  Clock, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  Info,
  ArrowRight,
  Plus,
  Trash2,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { usePublicClient, useConnectorClient, useAccount, useDeployContract } from "wagmi";
import { deployContract as viemDeployContract } from "viem/actions";
import { avalancheFuji } from "viem/chains";
import { avapayBatchPayrollAbi, avapayBatchPayrollBytecode } from "@/lib/contracts/avapayBatchPayroll";
import { toast } from "sonner";
import { FUJI_USDC_ADDRESS } from "@shared/constants";

export default function Deploy() {
  const { address: owner, status: connectStatus } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const publicClient = usePublicClient();
  const { mutateAsync: deployContract } = useDeployContract();

  const [employeeAddress, setEmployeeAddress] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [model, setModel] = React.useState("monthly");
  const [isDeploying, setIsDeploying] = React.useState(false);

  const deploy = React.useCallback(async () => {
    // Debug: inspect what's blocking the button
    const debug = {
      owner: owner ?? null,
      hasConnectorClient: !!connectorClient,
      connectStatus,
      chainId: connectorClient ? Number((connectorClient as { chain?: { id?: number } }).chain?.id) : null,
    };
    console.log("[Deploy] debug:", debug);

    if (!owner) {
      toast.error("Connect your wallet first.");
      return;
    }

    setIsDeploying(true);
    try {
      let hash: `0x${string}` | undefined;
      if (connectorClient) {
        hash = await viemDeployContract(connectorClient as Parameters<typeof viemDeployContract>[0], {
          abi: avapayBatchPayrollAbi,
          bytecode: avapayBatchPayrollBytecode as `0x${string}`,
          args: [FUJI_USDC_ADDRESS as `0x${string}`, owner],
          chain: avalancheFuji,
          account: owner as `0x${string}`,
        } as any);
      } else {
        hash = await deployContract({
          abi: avapayBatchPayrollAbi,
          bytecode: avapayBatchPayrollBytecode as `0x${string}`,
          args: [FUJI_USDC_ADDRESS as `0x${string}`, owner],
          chainId: avalancheFuji.id,
        });
      }
      if (!hash) throw new Error("Deploy returned no hash");
      toast.message("Deployment submitted", { description: hash });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      const contractAddress = receipt.contractAddress;
      if (!contractAddress) throw new Error("No contract address in receipt");

      const res = await fetch("/api/employer/payroll-contract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payrollContractAddress: contractAddress }),
      });
      if (!res.ok) throw new Error("Failed to persist contract address");

      toast.success("Payroll contract deployed", { description: contractAddress });
    } catch (e: any) {
      toast.error("Deploy failed", { description: e?.message ?? String(e) });
    } finally {
      setIsDeploying(false);
    }
  }, [owner, deployContract, publicClient, connectorClient]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contract Factory v2.0</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-glow">Deploy Payroll Contract</h1>
          <p className="text-muted-foreground">Automate salary streams with programmable, secure on-chain contracts.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Form Section */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-card rounded-2xl p-8 space-y-8">
              {/* Employee Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">1</div>
                  <h3 className="font-bold">Employee Configuration</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wallet" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee Wallet Address</Label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="wallet"
                        placeholder="0x..." 
                        className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 focus-visible:ring-primary/50"
                        value={employeeAddress}
                        onChange={(e) => setEmployeeAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salary" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Salary (USDC)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="salary"
                          type="number" 
                          placeholder="5,000" 
                          className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 focus-visible:ring-primary/50"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Model</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 focus-visible:ring-primary/50">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10">
                          <SelectItem value="monthly" className="focus:bg-white/5">Monthly Batch</SelectItem>
                          <SelectItem value="weekly" className="focus:bg-white/5">Weekly Stream</SelectItem>
                          <SelectItem value="realtime" className="focus:bg-white/5">Real-time Streaming</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/5" />

              {/* Streaming Parameters */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">2</div>
                  <h3 className="font-bold">Streaming Parameters</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 focus-visible:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <div className="flex items-center justify-between h-12 px-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-sm font-medium">Auto-Renew Stream</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={deploy}
                  disabled={isDeploying || !owner || connectStatus !== "connected"}
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-bold shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Zap className="mr-2 h-5 w-5 fill-current" />
                  {isDeploying ? "Deploying..." : "Confirm & Deploy Contract"}
                </Button>
                <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-bold">
                  Transactions are immutable once confirmed on Avalanche.
                </p>
              </div>
            </div>
          </div>

          {/* Preview & Info Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Smart Contract Preview */}
            <div className="glass-card rounded-2xl overflow-hidden border border-primary/20 bg-primary/5">
              <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest">Contract Preview</h3>
                <Badge variant="outline" className="text-[8px] border-primary/40 text-primary uppercase font-black">Ready</Badge>
              </div>
              <div className="p-6 space-y-4 font-mono">
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground">// AvaPay Stream Initialization</p>
                  <p className="text-[10px] text-primary break-all leading-relaxed">
                    deployContract(<span className="text-accent">"Payroll_v2"</span>, &#123;<br />
                    &nbsp;&nbsp;recipient: <span className="text-accent">{employeeAddress || "0x..."}</span>,<br />
                    &nbsp;&nbsp;amount: <span className="text-accent">{amount || "0"}</span>,<br />
                    &nbsp;&nbsp;currency: <span className="text-accent">"USDC"</span>,<br />
                    &nbsp;&nbsp;model: <span className="text-accent">"{model}"</span>,<br />
                    &nbsp;&nbsp;gasToken: <span className="text-accent">"AVAX"</span><br />
                    &#125;);
                  </p>
                </div>
              </div>
            </div>

            {/* Gas Estimate Card */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  <h4 className="text-sm font-bold">Estimated Gas Cost</h4>
                </div>
                <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 text-[10px]">Low Traffic</Badge>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-black">0.0084 AVAX</p>
                <p className="text-xs text-muted-foreground font-medium">~$0.24 USD</p>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-accent w-[15%]" />
              </div>
            </div>

            {/* Help/Notice Card */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <AlertCircle className="h-4 w-4" />
                <h4 className="text-sm font-bold">Important Notice</h4>
              </div>
              <ul className="space-y-3">
                {[
                  "Vault uses Fuji USDC. Fund it from your wallet.",
                  "Ensure employee addresses are correct.",
                  "Avalanche C-Chain confirmations are final.",
                  "Smart contracts are fully auditable."
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                    <div className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
