import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  FileCode2, 
  Users, 
  ShieldCheck, 
  Menu,
  Activity,
  Box,
  CircleDot
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail
} from "@/components/ui/sidebar";
import { WalletConnect } from "./WalletConnect";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/use-auth";

const navItems = [
  {
    title: "Protocol Overview",
    path: "/protocol",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    title: "Employer Dashboard",
    path: "/employer",
    icon: Building2,
    roles: ["admin", "employer"],
  },
  {
    title: "Smart Contracts",
    path: "/deploy",
    icon: FileCode2,
    roles: ["admin", "employer"],
  },
  {
    title: "Employee Portal",
    path: "/employee",
    icon: Users,
    roles: ["admin", "employee"],
  },
  {
    title: "Compliance & Reporting",
    path: "/compliance",
    icon: ShieldCheck,
    roles: ["admin"],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter((item) => user && item.roles.includes(user.role as string));

  const homePath =
    user?.role === "employer" ? "/employer" : user?.role === "employee" ? "/employee" : user?.role === "admin" ? "/protocol" : "/";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-white/5">
          <SidebarHeader className="h-16 flex items-center px-6 border-b border-white/5">
            <Link to={homePath} className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_-3px_hsl(var(--primary))] group-hover:scale-105 transition-transform">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">
                AVA<span className="text-primary">PAY</span>
              </span>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-2">
                Main Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNavItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.path}
                        tooltip={item.title}
                        className={cn(
                          "transition-all duration-200 py-6",
                          location.pathname === item.path
                            ? "bg-primary/10 text-primary border-r-2 border-primary rounded-none"
                            : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Link to={item.path} className="flex items-center gap-3">
                          <item.icon className={cn("h-5 w-5", location.pathname === item.path ? "text-primary" : "")} />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-white/5 group-data-[collapsible=icon]:p-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
                <CircleDot className="h-3 w-3 text-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fuji Testnet</span>
              </div>
              <div className="glass rounded-xl p-3 flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Gas Price</span>
                  <span className="text-[10px] font-bold text-primary">25 nAVAX</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[40%]" />
                </div>
              </div>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex flex-col min-h-screen bg-background/50 backdrop-blur-3xl overflow-hidden">
          <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary px-3 py-1 gap-1.5 hidden sm:flex">
                  <Box className="h-3 w-3" />
                  Avalanche C-Chain
                </Badge>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <span className="text-xs text-muted-foreground font-medium hidden sm:block">Protocol v2.4.0</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <WalletConnect />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="max-w-7xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
