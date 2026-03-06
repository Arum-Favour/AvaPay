import * as React from "react";
import Layout from "@/components/Layout";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  ShieldCheck, 
  Clock, 
  Coins, 
  Zap, 
  ChevronRight,
  ExternalLink,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const transactions = [
  {
    id: 1,
    type: "Salary Stream",
    amount: "+ 850.25 USDC",
    date: "2 hours ago",
    status: "Confirmed",
    hash: "0x4a...e12b",
  },
  {
    id: 2,
    type: "Withdrawal",
    amount: "- 2,400.00 USDC",
    date: "2 days ago",
    status: "Confirmed",
    hash: "0x8f...c94d",
  },
  {
    id: 3,
    type: "Salary Stream",
    amount: "+ 1,200.00 USDC",
    date: "1 week ago",
    status: "Confirmed",
    hash: "0x2d...a56f",
  },
  {
    id: 4,
    type: "Bonus Payment",
    amount: "+ 500.00 USDC",
    date: "2 weeks ago",
    status: "Confirmed",
    hash: "0x9b...110e",
  },
];

export default function EmployeePortal() {
  const { user } = useAuth();
  const [earnings, setEarnings] = React.useState(1245.50);
  const [withdrawable, setWithdrawable] = React.useState(425.80);

  const salaryNum = React.useMemo(() => {
    if (!user?.salary) return 8500;
    const cleaned = user.salary.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 8500;
  }, [user?.salary]);

  const ratePerSec = salaryNum / (30 * 24 * 3600);

  // Simulate real-time streaming earnings
  React.useEffect(() => {
    const interval = setInterval(() => {
      setEarnings(prev => prev + ratePerSec / 10);
      setWithdrawable(prev => prev + ratePerSec / 10);
    }, 100);
    return () => clearInterval(interval);
  }, [ratePerSec]);

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
              {user?.jobTitle ? `${user.jobTitle} Portal` : "Employee Portal"}
            </h1>
            <p className="text-muted-foreground">
              {user?.salary ? `Your salary of ${user.salary} is being streamed on Avalanche.` : "Manage your on-chain earnings and withdrawals on Avalanche."}
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
                      ${earnings.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </span>
                    <span className="text-xl font-bold text-primary">USDC</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Withdrawable Balance</p>
                      <p className="text-3xl font-bold tabular-nums">
                        ${withdrawable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Button className="w-full rounded-2xl bg-primary hover:bg-primary/90 h-14 text-lg font-bold shadow-[0_0_25px_-5px_hsl(var(--primary)/0.6)] group/btn">
                      <ArrowUpRight className="mr-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Withdraw to Wallet
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Stream Progress</p>
                        <span className="text-[10px] font-bold text-primary">84% of Monthly Cycle</span>
                      </div>
                      <Progress value={84} className="h-2 bg-white/5" />
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Current Rate</p>
                          <p className="text-xs font-bold">{ratePerSec.toFixed(6)} USDC / sec</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Next unlock</p>
                        <p className="text-xs font-bold">~ 12 minutes</p>
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
                  <h4 className="font-bold">Destination Wallet</h4>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Your Avalanche Address</p>
                  <p className="text-sm font-mono font-bold break-all">0x71C2496EC071E763BfA3A69f5831e7890b23E4d</p>
                </div>
                <p className="text-[10px] text-muted-foreground flex gap-1.5 items-start">
                  <Info className="h-3 w-3 shrink-0" />
                  All withdrawals are processed instantly on-chain. Ensure your wallet supports USDC on Avalanche C-Chain.
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
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">{tx.type}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {tx.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-black",
                        tx.amount.startsWith('+') ? "text-emerald-500" : "text-white"
                      )}>
                        {tx.amount}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">{tx.hash}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">{tx.status}</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
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
