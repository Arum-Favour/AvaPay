import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Use cases", href: "#use-cases" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Background gradients (match auth pages vibe) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[140px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_-6px_hsl(var(--primary)/0.9)] group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter">
              AVA<span className="text-primary">PAY</span>
            </span>
            <Badge variant="outline" className="hidden sm:inline-flex border-white/10 bg-white/5 text-[10px] uppercase tracking-widest font-semibold">
              Fuji demo
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={cn(
                  "text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors",
                )}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-full text-xs font-black uppercase tracking-widest">
              <Link to="/signin" state={{ from: location.pathname }}>
                Sign in
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Link to="/signup" state={{ from: location.pathname }}>
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
          {children}
        </div>
      </main>

      <footer className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-muted-foreground">
          <p className="font-semibold uppercase tracking-widest">AvaPay · Web3 payroll infrastructure on Avalanche</p>
          <div className="flex items-center gap-4">
            <a className="hover:text-foreground transition-colors" href="#features">Features</a>
            <a className="hover:text-foreground transition-colors" href="#use-cases">Use cases</a>
            <a className="hover:text-foreground transition-colors" href="#how-it-works">How it works</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

