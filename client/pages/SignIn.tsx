import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, ShieldCheck, Activity, ArrowRight, Loader2, User, Building2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, UserRole } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useConnect, useAccount, useSignMessage } from 'wagmi';

export default function SignIn() {
  const navigate = useNavigate();
  const { loginWithSiwe, isLoading: isAuthLoading } = useAuth();
  const { connect, connectors, isPending: isConnectLoading } = useConnect();
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSignPending } = useSignMessage();
  const [role, setRole] = React.useState<UserRole>(null);
  const [step, setStep] = React.useState(1);

  const roles = [
    { id: "employer", title: "Employer", icon: Building2, desc: "Manage payroll and company treasury." },
    { id: "employee", title: "Employee", icon: User, desc: "View earnings and withdraw salary." },
    { id: "admin", title: "Protocol Admin", icon: UserCog, desc: "Infrastructure and protocol operations." },
  ];

  React.useEffect(() => {
    if (isConnected && address) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [isConnected, address]);

  const handleConnect = async () => {
    const connector = connectors[0]; // Usually injected
    if (connector) {
      connect({ connector });
    }
  };

  const handleSignIn = async () => {
    if (address && role) {
      await loginWithSiwe({
        address,
        role,
        signMessageAsync: ({ message }) => signMessageAsync({ account: address as `0x${string}`, message }),
      });
      if (role === "employer") navigate("/employer");
      else if (role === "employee") navigate("/employee");
      else navigate("/");
    }
  };

  const isLoading = isAuthLoading || isConnectLoading || isSignPending;

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[480px] z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_25px_-5px_hsl(var(--primary))] group-hover:scale-105 transition-transform">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="font-black text-3xl tracking-tighter">
              AVA<span className="text-primary">PAY</span>
            </span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Institutional Web3 Gateway</h1>
            <p className="text-muted-foreground text-sm">Secure access to the AvaPay decentralized payroll protocol.</p>
          </div>
        </div>

        <div className="glass-card rounded-[32px] p-8 border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50" />
          
          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Secure Verification</h4>
                    <p className="text-[11px] text-muted-foreground">Encryption powered by Avalanche C-Chain.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] group/btn"
              >
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <>
                    <Wallet className="mr-3 h-5 w-5" />
                    Connect Web3 Wallet
                  </>
                )}
              </Button>

              <div className="text-center">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                  New to AvaPay? <Link to="/signup" className="text-primary hover:underline">Register Infrastructure</Link>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-center">Select Your Institutional Role</h3>
                <div className="grid grid-cols-1 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id as UserRole)}
                      className={cn(
                        "p-4 rounded-2xl text-left transition-all duration-300 border relative overflow-hidden group/role",
                        role === r.id 
                          ? "bg-primary/10 border-primary shadow-[0_0_15px_-5px_hsl(var(--primary)/0.4)]" 
                          : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                          role === r.id ? "bg-primary text-white" : "bg-white/5 text-muted-foreground group-hover/role:bg-white/10"
                        )}>
                          <r.icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold">{r.title}</p>
                          <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                        </div>
                        {role === r.id && <ArrowRight className="h-4 w-4 text-primary ml-auto animate-pulse" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  onClick={handleSignIn}
                  disabled={!role || isLoading}
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)]"
                >
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Access Dashboard"}
                </Button>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="text-[10px] text-center text-muted-foreground font-mono truncate px-4">
                    Connected: {address}
                  </div>
                  <button 
                    onClick={() => setStep(1)} 
                    className="w-full text-[11px] text-muted-foreground hover:text-white font-bold uppercase tracking-widest"
                  >
                    Disconnect or Change Wallet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6">
          <Badge variant="outline" className="border-white/5 text-[10px] uppercase font-bold text-muted-foreground bg-white/5">v2.4.0 Fuji</Badge>
          <div className="h-4 w-px bg-white/10" />
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Audited by CertiK</p>
        </div>
      </div>
    </div>
  );
}
