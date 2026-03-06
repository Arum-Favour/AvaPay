import * as React from "react";
import Layout from "@/components/Layout";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Clock,
  ExternalLink,
  Plus,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const chartData = [
  { month: "Jan", volume: 4200000 },
  { month: "Feb", volume: 5100000 },
  { month: "Mar", volume: 4800000 },
  { month: "Apr", volume: 6200000 },
  { month: "May", volume: 7500000 },
  { month: "Jun", volume: 8900000 },
  { month: "Jul", volume: 10500000 },
  { month: "Aug", volume: 12500000 },
];

const chartConfig = {
  volume: {
    label: "Payroll Volume",
    color: "hsl(var(--primary))",
  },
};

const activities = [
  {
    id: 1,
    company: "TechFlow Systems",
    amount: "$450,000",
    time: "2 mins ago",
    status: "Confirmed",
    hash: "0x4a...e12b",
  },
  {
    id: 2,
    company: "Nexus AI Lab",
    amount: "$12,400",
    time: "15 mins ago",
    status: "Streaming",
    hash: "0x8f...c94d",
  },
  {
    id: 3,
    company: "Stellar Cloud",
    amount: "12 Employees",
    time: "42 mins ago",
    status: "Active",
    hash: "0x2d...a56f",
  },
  {
    id: 4,
    company: "Employee ID: 452",
    amount: "$2,850",
    time: "1 hour ago",
    status: "Confirmed",
    hash: "0x9b...110e",
  },
];

export default function ProtocolOverview() {
  const { systemStats } = useAuth();

  const stats = [
    {
      label: "Total Payroll Volume (TVP)",
      value: systemStats.totalVolume,
      change: "+12.5%",
      trend: "up" as const,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active Companies",
      value: systemStats.activeCompanies,
      change: "+4",
      trend: "up" as const,
      icon: Briefcase,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Active Salary Streams",
      value: systemStats.activeStreams,
      change: "+156",
      trend: "up" as const,
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Treasury Locked",
      value: systemStats.treasuryLocked,
      change: "-2.1%",
      trend: "down" as const,
      icon: Shield,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-glow">Protocol Overview</h1>
            <p className="text-muted-foreground">Real-time infrastructure analytics for AvaPay payroll protocol.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full border-white/5 bg-white/5 hover:bg-white/10">
              <Activity className="mr-2 h-4 w-4" />
              View Explorer
            </Button>
            <Button
              asChild
              className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <Link to="/deploy">
                <Plus className="mr-2 h-4 w-4" />
                Deploy New Payroll Contract
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-2xl p-6 space-y-4 group hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                    stat.trend === "up" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-card rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Monthly Payroll Volume</h3>
                <p className="text-sm text-muted-foreground">Historical volume tracking in USD equivalents.</p>
              </div>
              <div className="flex bg-white/5 rounded-lg p-1">
                {["1M", "3M", "6M", "1Y", "ALL"].map((period) => (
                  <button
                    key={period}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                      period === "ALL" ? "bg-primary text-white" : "hover:bg-white/5 text-muted-foreground",
                    )}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `$${value / 1000000}M`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>

          <div className="glass-card rounded-2xl flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-bold">Live Activity</h3>
              </div>
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px]">
                Syncing Live
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[450px] p-4 space-y-4 custom-scrollbar">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{activity.company}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{activity.amount}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{activity.hash}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                        {activity.status}
                      </span>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5">
              <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-white">
                View All Activity
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

