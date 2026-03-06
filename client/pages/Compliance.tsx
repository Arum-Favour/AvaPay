import * as React from "react";
import Layout from "@/components/Layout";
import { 
  ShieldCheck, 
  Download, 
  FileSearch, 
  BarChart3, 
  Settings2, 
  Database,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowRight,
  TrendingUp,
  PieChart,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const reports = [
  {
    id: "REP-2024-001",
    name: "Q3 Payroll Audit Log",
    date: "Oct 15, 2024",
    size: "2.4 MB",
    status: "Verified",
  },
  {
    id: "REP-2024-002",
    name: "Avalanche C-Chain Tax Summary",
    date: "Oct 01, 2024",
    size: "1.8 MB",
    status: "Verified",
  },
  {
    id: "REP-2024-003",
    name: "DAO Treasury Analytics",
    date: "Sep 15, 2024",
    size: "4.2 MB",
    status: "Verified",
  },
  {
    id: "REP-2024-004",
    name: "Employee Token Distribution",
    date: "Sep 01, 2024",
    size: "1.1 MB",
    status: "Verified",
  },
];

export default function Compliance() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Compliance & Analytics</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-glow">Reporting Panel</h1>
            <p className="text-muted-foreground">Institutional audit trails and real-time treasury analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10">
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
            <Button className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Settings2 className="mr-2 h-4 w-4" />
              API Settings
            </Button>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-5 w-5 text-primary" />
              <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px]">Real-time</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase">Treasury Efficiency</p>
              <p className="text-3xl font-black tracking-tight">98.4%</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold">
              <TrendingUp className="h-3 w-3" />
              +1.2% vs last month
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <PieChart className="h-5 w-5 text-accent" />
              <Badge variant="outline" className="text-[10px]">Monthly</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase">Compliance Score</p>
              <p className="text-3xl font-black tracking-tight">A+</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Fully compliant with ERC-20 standards.</p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-400" />
              <Badge variant="outline" className="text-[10px]">Active</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase">DAO Payroll Mode</p>
              <p className="text-3xl font-black tracking-tight">ON</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Governance controlled.</p>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Reports Table */}
          <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border border-white/5">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-bold">Payroll Export Reports</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-wider font-bold">Report Name</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-bold">Date</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-bold">Size</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-bold">Status</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-bold text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="py-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold">{report.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{report.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{report.date}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{report.size}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-0">
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 bg-white/[0.01] text-center border-t border-white/5">
              <Button variant="link" className="text-xs text-muted-foreground hover:text-white no-underline">
                Load more reports
              </Button>
            </div>
          </div>

          {/* Audit Trail & API Sidebar */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-bold">On-Chain Audit Trail</h3>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Smart Contract Vetted", status: "Verified", time: "2h ago" },
                  { title: "Treasury Sync", status: "Complete", time: "4h ago" },
                  { title: "Gas Refund Processed", status: "Success", time: "1d ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.time}</p>
                    </div>
                    <Badge variant="outline" className="text-[8px] bg-emerald-500/5 text-emerald-500 border-emerald-500/20">{item.status}</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold h-10 group">
                Open Explorer Audit
                <ExternalLink className="ml-2 h-3 w-3 group-hover:scale-110 transition-transform" />
              </Button>
            </div>

            <div className="glass-card rounded-2xl p-6 bg-accent/5 border-accent/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Settings2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold">API Integration</h3>
                </div>
                <Switch />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">
                Connect your existing Web2 payroll software via our secure REST API for automated on-chain synchronization.
              </p>
              <Button variant="outline" className="w-full rounded-xl border-accent/20 bg-accent/5 text-accent hover:bg-accent/10 text-xs font-bold h-10 group">
                Documentation
                <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
