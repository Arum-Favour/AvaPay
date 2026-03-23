import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, ShieldCheck, Activity, ArrowRight, User, Building2, UserCog, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { type UserRole } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useProtocolAuth } from "@/hooks/use-protocol-auth";
import { toast } from "sonner";

export default function SignUp() {
  const navigate = useNavigate();
  const { address, isWalletConnected, connectAccount, signUp, progress, busy } = useProtocolAuth();
  const [email, setEmail] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [salary, setSalary] = React.useState("");
  const [role, setRole] = React.useState<UserRole>(null);
  const [step, setStep] = React.useState(1);

  const roles = [
    { id: "employer", title: "Employer", icon: Building2, desc: "For companies managing payroll streams." },
    { id: "employee", title: "Employee", icon: User, desc: "For individuals receiving salaries." },
    { id: "admin", title: "Protocol Admin", icon: UserCog, desc: "For infrastructure and DAO operators." },
  ];

  const handleConfirmRegistration = async () => {
    try {
      if (!isWalletConnected) {
        await connectAccount();
        return;
      }

      if (!address || !email || !role) return;

      await signUp({
        role,
        email,
        companyName: role === "employer" ? companyName : undefined,
      });

      if (role === "employer") navigate("/employer");
      else if (role === "employee") navigate("/employee");
      else navigate("/");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Signup failed");
    }
  };

  const progressLabel = (() => {
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
  })();

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[520px] z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
            <h1 className="text-2xl font-extrabold tracking-tight text-glow">Register Protocol Infrastructure</h1>
            <p className="text-muted-foreground text-sm">Join the future of borderless on-chain salary automation.</p>
          </div>
        </div>

        <div className="glass-card rounded-[32px] p-10 border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50" />
          
          <div className="space-y-8">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300",
                    step === s ? "bg-primary text-white scale-110 shadow-[0_0_15px_hsl(var(--primary))]" : step > s ? "bg-emerald-500 text-white" : "bg-white/5 text-muted-foreground"
                  )}>
                    {step > s ? "✓" : s}
                  </div>
                  {s < 4 && <div className={cn("h-0.5 w-8 md:w-12 transition-colors duration-300", step > s ? "bg-emerald-500" : "bg-white/5")} />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select Protocol Role</h3>
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
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <Button 
                  disabled={!role} 
                  onClick={() => setStep(2)}
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black"
                >
                  Continue <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    {role === "employer" ? "Company Profile" : role === "employee" ? "Professional Profile" : "Admin Details"}
                  </h3>

                  {role === "employer" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Legal Entity Name</Label>
                        <Input
                          placeholder="e.g. TechFlow Systems Inc."
                          className="h-12 rounded-xl bg-white/5 border-white/10"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] text-muted-foreground">As an employer, you'll be able to fund your treasury and manage multiple employee salary streams.</p>
                      </div>
                    </div>
                  )}

                  {role === "employee" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job Title</Label>
                        <Input
                          placeholder="e.g. Senior Software Engineer"
                          className="h-12 rounded-xl bg-white/5 border-white/10"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expected Monthly Salary (USDC)</Label>
                        <Input
                          type="number"
                          placeholder="5000"
                          className="h-12 rounded-xl bg-white/5 border-white/10"
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {role === "admin" && (
                    <div className="p-8 text-center space-y-4">
                      <UserCog className="h-12 w-12 text-primary mx-auto opacity-50" />
                      <p className="text-sm text-muted-foreground">Admin accounts have protocol-wide visibility and infrastructure management privileges.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)} className="h-14 flex-1 rounded-2xl border-white/5 text-muted-foreground hover:text-white">Back</Button>
                  <Button
                    disabled={role === "employer" ? !companyName : role === "employee" ? (!jobTitle || !salary) : false}
                    onClick={() => setStep(3)}
                    className="h-14 flex-[2] rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black"
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Identity Verification</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {role === "employer" ? "Institutional Email" : "Professional Email"}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="name@organization.com"
                          className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 focus-visible:ring-primary/50"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3 items-start">
                      <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
                      <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                        By providing your institutional email, you agree to comply with the decentralized payroll DAO governance standards.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(2)} className="h-14 flex-1 rounded-2xl border-white/5 text-muted-foreground hover:text-white">Back</Button>
                  <Button
                    disabled={!email || !email.includes("@")}
                    onClick={() => setStep(4)}
                    className="h-14 flex-[2] rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black"
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-4 text-center">
                  <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20 animate-bounce">
                    <Wallet className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Verify it&apos;s you</h3>
                    <p className="text-sm text-muted-foreground">
                      Confirm in your account to complete registration.
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase font-bold tracking-widest">Selected Role</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-tighter">{role}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase font-bold tracking-widest">Network</span>
                    <span className="font-bold flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Avalanche Fuji</span>
                  </div>
                  {address && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground uppercase font-bold tracking-widest">Account</span>
                      <span className="font-mono text-[10px] truncate max-w-[150px]">{address}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleConfirmRegistration}
                    disabled={busy}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] group/btn"
                  >
                    <>
                      {busy ? null : isWalletConnected ? (
                        <ShieldCheck className="mr-3 h-5 w-5" />
                      ) : (
                        <Wallet className="mr-3 h-5 w-5" />
                      )}
                      {busy ? progressLabel || "Confirming on network…" : isWalletConnected ? "Confirm registration" : "Connect account"}
                    </>
                  </Button>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full text-[11px] text-muted-foreground hover:text-white font-bold uppercase tracking-widest"
                  >
                    Change email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
            Already registered?{" "}
            <Link to="/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
