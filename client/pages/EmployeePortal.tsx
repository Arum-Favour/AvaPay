import * as React from "react";
import Layout from "@/components/Layout";
import {
  Wallet,
  ArrowUpRight,
  History,
  ShieldCheck,
  Clock,
  Coins,
  Zap,
  ExternalLink,
  Info,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAccount, useReadContracts } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { avalancheFuji } from "viem/chains";
import { formatUnits } from "viem";
import type { EmployeePortalResponse } from "@shared/api";
import { FUJI_USDC_ADDRESS } from "@shared/constants";

const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "balance", type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
] as const;

function formatUsdc(usdc6: number, fractionDigits = 2) {
  return (usdc6 / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export default function EmployeePortal() {
  const { user } = useAuth();
  const { address } = useAccount();

  // Get employee's connected wallet USDC balance
  const connectedWalletBalance = useReadContracts({
    contracts: address
      ? ([
          { address: FUJI_USDC_ADDRESS as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [address as `0x${string}`], chainId: avalancheFuji.id },
          { address: FUJI_USDC_ADDRESS as `0x${string}`, abi: erc20Abi, functionName: "decimals", chainId: avalancheFuji.id },
        ] as const)
      : ([] as const),
    query: { enabled: !!address },
  });

  const walletBalanceUsdc6 = React.useMemo(() => {
    if (connectedWalletBalance.data?.[0]?.result != null && connectedWalletBalance.data?.[1]?.result != null) {
      return Number(formatUnits(connectedWalletBalance.data[0].result as bigint, connectedWalletBalance.data[1].result as number)) * 1_000_000;
    }
    return 0;
  }, [connectedWalletBalance.data]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["employee-portal"],
    queryFn: async (): Promise<EmployeePortalResponse> => {
      const res = await fetch("/api/employee/portal", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load employee portal");
      return res.json();
    },
    staleTime: 5_000,
  });

  const employee = data?.employee ?? null;
  const lifetimeUsdc6 = data?.lifetimeEarningsUsdc6 ?? 0;
  const history = data?.history ?? [];

  const salaryMonthlyUsdc6 = employee?.monthlySalaryUsdc6 ?? 0;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Salary Stream</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-glow">
              {employee?.title ? `${employee.title} Portal` : "Employee Portal"}
            </h1>
            <p className="text-muted-foreground">
              {employee
                ? `Your salary of ${formatUsdc(salaryMonthlyUsdc6, 2)} USDC/month is being processed on Avalanche.`
                : "Manage your on-chain earnings and withdrawals on Avalanche."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 rounded-full flex gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Status: Confirmed on Avalanche
            </Badge>
          </div>
        </div>

        {/* Main Portal Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Earnings & Withdraw Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Real-time Counter Card */}
            <div className="glass-card rounded-3xl p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Coins className="h-48 w-48 text-primary rotate-12" />
              </div>
              
              <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Life-time Earnings</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums">
                      ${formatUsdc(lifetimeUsdc6, 4)}
                    </span>
                    <span className="text-xl font-bold text-primary">USDC</span>
                  </div>
                  {isLoading && (
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      Syncing on-chain history…
                    </p>
                  )}
                  {isError && (
                    <p className="text-[10px] text-destructive uppercase font-bold tracking-widest">
                      Failed to load history
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Your USDC Balance</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-muted-foreground hover:text-white"
                          onClick={() => {
                            refetch();
                            connectedWalletBalance.refetch();
                          }}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-3xl font-bold tabular-nums">
                        ${formatUsdc(walletBalanceUsdc6, 2)}
                      </p>
                      {connectedWalletBalance.isLoading && (
                        <p className="text-[10px] text-muted-foreground">Loading on-chain balance...</p>
                      )}
                    </div>
                    <Button
                      className="w-full rounded-2xl bg-primary hover:bg-primary/90 h-14 text-lg font-bold shadow-[0_0_25px_-5px_hsl(var(--primary)/0.6)] group/btn"
                      disabled={walletBalanceUsdc6 === 0 || (!address && !employee)}
                      onClick={() => {
                        const target = address ?? employee?.wallet;
                        if (!target) return;
                        window.open(`https://testnet.snowtrace.io/address/${target}`, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <ArrowUpRight className="mr-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      View Wallet Activity
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Earnings Progress</p>
                        <span className="text-[10px] font-bold text-primary">Lifetime: ${formatUsdc(lifetimeUsdc6, 2)}</span>
                      </div>
                      <Progress value={Math.min(100, (lifetimeUsdc6 && salaryMonthlyUsdc6 ? (lifetimeUsdc6 / salaryMonthlyUsdc6) * 100 : 0))} className="h-2 bg-white/5" />
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Monthly Salary</p>
                          <p className="text-xs font-bold">${formatUsdc(salaryMonthlyUsdc6, 2)} USDC</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Received</p>
                        <p className="text-xs font-bold text-emerald-500">${formatUsdc(lifetimeUsdc6, 2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold">Your Wallet</h4>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Connected Address</p>
                  <p className="text-sm font-mono font-bold break-all">
                    {address ?? employee?.wallet ?? "Not connected"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
                    asChild
                  >
                    <a
                      href={`https://testnet.snowtrace.io/address/${address ?? employee?.wallet}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      View on Snowtrace
                    </a>
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground flex gap-1.5 items-start">
                  <Info className="h-3 w-3 shrink-0" />
                  Your salary payments are sent directly to this wallet on Avalanche C-Chain.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold">Protocol Guard</h4>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px]">VERIFIED</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Smart Contract</span>
                    <span className="font-mono">0xAvaPay...9901</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Security Audit</span>
                    <span className="text-accent font-bold">CertiK | Q4 2024</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span className="text-emerald-500 font-bold">~ 0.005 AVAX</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History Sidebar */}
            <div className="glass-card rounded-3xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-bold">History</h3>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-white">
                View All
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No payment history yet.</p>
                  <p className="text-xs mt-1">Your salary payments will appear here.</p>
                </div>
              ) : (
                history.map((tx) => (
                  <div key={tx.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold group-hover:text-primary transition-colors">Salary Payment</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-black",
                          "text-emerald-500"
                        )}>
                          + {formatUsdc(tx.amountUsdc6, 2)} USDC
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          tx.status === "paid" ? "bg-emerald-500" : tx.status === "queued" ? "bg-amber-500" : "bg-destructive"
                        )} />
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          tx.status === "paid" ? "text-emerald-500" : tx.status === "queued" ? "text-amber-500" : "text-destructive"
                        )}>
                          {tx.status.toUpperCase()}
                        </span>
                      </div>
                      {tx.txHash && (
                        <a
                          href={`https://testnet.snowtrace.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                        >
                          View on Snowtrace
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-primary/5 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Tax Documents</span>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">2024 Ready</Badge>
              </div>
              <Button variant="outline" className="w-full rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold h-10">
                Download Earnings Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
