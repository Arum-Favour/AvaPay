import * as React from "react";
import MarketingLayout from "@/components/MarketingLayout";
import {
  Activity,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Globe2,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const featureBlocks = [
  {
    label: "Deterministic on‑chain payroll",
    title: "Programmable salary rails on Avalanche",
    body: "Define monthly, weekly, or streaming payroll once—AvaPay executes the payouts on-chain with transparent, auditable flows.",
    icon: Clock,
  },
  {
    label: "Treasury‑grade security",
    title: "Segregated vaults for payroll funds",
    body: "Isolate payroll capital in dedicated smart contracts with role‑aware access and explicit payout rules.",
    icon: ShieldCheck,
  },
  {
    label: "Enterprise compliance",
    title: "Receipts, audit trails, and reporting",
    body: "Generate on‑chain receipts, exportable ledgers, and regulatory‑ready views of every payroll cycle.",
    icon: Activity,
  },
  {
    label: "Global teams, one stack",
    title: "USDC‑denominated payouts over Avalanche",
    body: "Pay contributors in stablecoins on Avalanche Fuji/mainnet while preserving a single source of truth for obligations.",
    icon: Globe2,
  },
];

const useCases = [
  {
    title: "Web3‑native companies",
    body: "Automate contributor salaries, token incentives, and advisory retainers while keeping cap table and payroll fully on‑chain.",
    badge: "Crypto‑first teams",
  },
  {
    title: "Funds, DAOs & protocol treasuries",
    body: "Stream contributor payments from a segregated vault with clear mandates around who gets paid, when, and in what asset.",
    badge: "Treasury & governance",
  },
  {
    title: "Distributed enterprises",
    body: "Replace fragile spreadsheets with deterministic smart contracts and a single, verifiable history of payouts.",
    badge: "Global employers",
  },
];

export default function Index() {
  const { systemStats } = useAuth();

  return (
    <MarketingLayout>
      <div className="space-y-12">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-10 items-center">
          <div className="space-y-6">
            <Badge className="inline-flex items-center gap-2 rounded-full border-primary/20 bg-primary/10 text-xs font-semibold px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Built on Avalanche Fuji
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-glow leading-tight">
                Institutional‑grade Web3 payroll
                <span className="block text-primary">for Avalanche‑native teams.</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                AvaPay is a programmable payroll protocol that lets employers define, fund, and execute on‑chain salary obligations
                with the same guarantees they expect from enterprise treasury systems.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full px-6 shadow-lg shadow-primary/30">
                <Link to="/signup">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-white/10 bg-white/5">
                <Link to="/signin">
                  Sign in
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5 max-w-2xl">
              <StatPill label="Total volume" value={systemStats.totalVolume} />
              <StatPill label="Active companies" value={systemStats.activeCompanies} />
              <StatPill label="Active streams" value={systemStats.activeStreams} />
              <StatPill label="Treasury locked" value={systemStats.treasuryLocked} />
            </div>
          </div>

          {/* Hero side card */}
          <div className="glass-card rounded-3xl p-6 md:p-7 border border-white/10 space-y-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl opacity-60" />
            <div className="relative space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Sample payrun · Fuji
                    </p>
                    <p className="text-sm font-bold">TechFlow Systems Inc.</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px]">
                  On‑chain confirmed
                </Badge>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    Cycle
                  </p>
                  <p className="font-semibold">November 2024 · Monthly</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    Total obligations
                  </p>
                  <p className="font-semibold text-primary">$42,500.00</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-black/30 border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-muted-foreground uppercase tracking-widest">
                    Employees
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">28</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-muted-foreground uppercase tracking-widest">
                    Asset
                  </span>
                  <span className="font-semibold text-xs">USDC on Avalanche C‑Chain</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-muted-foreground uppercase tracking-widest">
                    Vault contract
                  </span>
                  <span className="font-mono text-[10px] truncate max-w-[160px]">
                    0xAvaPay...9901
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold uppercase tracking-widest">Ready to execute</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-accent" />
                  <span>~0.15 AVAX network fee</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] uppercase tracking-widest font-semibold">
                Why AvaPay
              </Badge>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                A full payroll stack, optimized for Web3 treasuries.
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                From on‑chain vaults to compliance‑ready reporting, AvaPay abstracts the complexity of running high‑trust,
                multi‑entity payroll flows on Avalanche.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featureBlocks.map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 border border-white/5 hover:border-primary/30 transition-colors space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                      {feature.label}
                    </p>
                    <p className="text-sm font-bold">{feature.title}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Use cases & flows */}
        <section id="use-cases" className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 scroll-mt-24">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Who AvaPay is for
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {useCases.map((u) => (
                <div
                  key={u.title}
                  className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-primary/5 text-primary text-[9px] font-semibold uppercase tracking-widest"
                    >
                      {u.badge}
                    </Badge>
                    <p className="text-sm font-bold">{u.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{u.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="how-it-works" className="glass-card rounded-2xl p-6 space-y-4 border border-white/5 scroll-mt-24">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                How a payrun executes
              </h3>
            </div>
            <ol className="space-y-3 text-xs">
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                  1
                </span>
                <div>
                  <p className="font-semibold">Connect treasury & define obligations</p>
                  <p className="text-muted-foreground">
                    Employer registers via SIWE, defines employees, salary bands, and payment cadence using the AvaPay employer
                    console.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                  2
                </span>
                <div>
                  <p className="font-semibold">Fund the smart‑contract vault</p>
                  <p className="text-muted-foreground">
                    Capital is moved into a dedicated AvaPay vault contract on Avalanche Fuji, segregating payroll from operating
                    balances.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                  3
                </span>
                <div>
                  <p className="font-semibold">Execute batch payroll on‑chain</p>
                  <p className="text-muted-foreground">
                    One transaction triggers the batch payout; employees can independently verify receipts and balances on
                    Snowtrace.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Trust & compliance strip */}
        <section id="security" className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 scroll-mt-24">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Designed for institutional review</p>
              <p className="text-[11px] text-muted-foreground max-w-xl">
                Every payrun produces an immutable, on‑chain record. Your finance, risk, and legal teams get the audit trail they need,
                without sacrificing the flexibility of Web3.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
              End‑to‑end on‑chain receipts
            </Badge>
            <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px]">
              Role‑based access for employers & employees
            </Badge>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 px-3 py-2 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
