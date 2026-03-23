import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProtocolAuth } from "@/hooks/use-protocol-auth";
import {
  ApiError,
  AUTH_ERROR_ACCOUNT_NOT_REGISTERED,
  AUTH_ERROR_ROLE_MISMATCH,
  AUTH_ERROR_ROLE_PROFILE_MISSING,
} from "@/lib/api";
import type { UserRole } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function progressToLabel(progress: string) {
  switch (progress) {
    case "preparing":
      return "Preparing…";
    case "confirm_wallet":
      return "Confirm in account…";
    case "confirming_network":
      return "Confirming on network…";
    case "done":
      return "Done";
    default:
      return "";
  }
}

export default function SignIn() {
  const navigate = useNavigate();
  const { address, isWalletConnected, connectAccount, signIn, signOut, progress, busy } = useProtocolAuth();

  const [step, setStep] = React.useState(isWalletConnected ? 2 : 1);
  const [needSignupOpen, setNeedSignupOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<Exclude<UserRole, null>>("employee");

  React.useEffect(() => {
    setStep(isWalletConnected ? 2 : 1);
  }, [isWalletConnected]);

  const handleConnect = async () => {
    try {
      await connectAccount();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not open wallet login");
    }
  };

  const handleSignIn = async () => {
    try {
      const profile = await signIn({ role: selectedRole });
      if (profile.role === "employer") navigate("/employer");
      else if (profile.role === "employee") navigate("/employee");
      else navigate("/");
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError && e.code === AUTH_ERROR_ACCOUNT_NOT_REGISTERED) {
        // If the wallet isn't registered, we must not allow any existing/stale session
        // to keep protected pages accessible.
        await signOut();
        setNeedSignupOpen(true);
        return;
      }
      if (e instanceof ApiError && (e.code === AUTH_ERROR_ROLE_MISMATCH || e.code === AUTH_ERROR_ROLE_PROFILE_MISSING)) {
        toast.error(e.message || "Selected role does not match this account");
        return;
      }
      toast.error(e instanceof Error ? e.message : "Sign in failed");
    }
  };

  const isLoading = busy;

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      <AlertDialog open={needSignupOpen} onOpenChange={setNeedSignupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No AvaPay account for this address</AlertDialogTitle>
            <AlertDialogDescription>
              This address isn&apos;t registered with AvaPay yet. Please sign up first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link to="/signup">Go to sign up</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <h1 className="text-2xl font-extrabold tracking-tight">Account sign in</h1>
            <p className="text-muted-foreground text-sm">Confirm your account to access AvaPay.</p>
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
                    <h4 className="text-sm font-bold">Sign in</h4>
                    <p className="text-[11px] text-muted-foreground">Use Privy to confirm your account.</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] group/btn"
              >
                <Wallet className="mr-3 h-5 w-5" />
                Sign in
              </Button>

              <div className="text-center">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                  New to AvaPay? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-center">
                  Verify it&apos;s you
                </h3>
                <p className="text-center text-sm text-muted-foreground px-2">
                  Confirm in your account to verify ownership of this account.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    type="button"
                    variant={selectedRole === "employee" ? "default" : "outline"}
                    onClick={() => setSelectedRole("employee")}
                    className="rounded-xl"
                  >
                    Employee
                  </Button>
                  <Button
                    type="button"
                    variant={selectedRole === "employer" ? "default" : "outline"}
                    onClick={() => setSelectedRole("employer")}
                    className="rounded-xl"
                  >
                    Employer
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)]"
                >
                  {isLoading ? progressToLabel(progress) || "Confirming on network…" : "Confirm"}
                </Button>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="text-[10px] text-center text-muted-foreground font-mono truncate px-4">
                    Connected account: {address ? shortAddr(address) : ""}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      setStep(1);
                    }}
                    className="w-full text-[11px] text-muted-foreground hover:text-white font-bold uppercase tracking-widest"
                  >
                    Change account
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
