import * as React from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ChevronDown, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useAccount } from 'wagmi';

export function WalletConnect() {
  const { user, signOut } = useAuth();
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    signOut();
    navigate("/signin");
  };

  const displayAddress = address || user?.address;
  const shortAddress = displayAddress 
    ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` 
    : "";

  if (!user || !isConnected) {
    return (
      <Button
        onClick={() => navigate("/signin")}
        className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-6 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] transition-all hover:scale-105 active:scale-95"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rounded-full pl-2 pr-4 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white">
              AVAX
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-xs font-bold font-mono tracking-tighter">{shortAddress}</span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{user.role}</span>
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass border-white/10 mt-2">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Institutional Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer py-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">1,245.50 USDC</span>
            <span className="text-[10px] text-muted-foreground">Available Balance</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer py-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">42.15 AVAX</span>
            <span className="text-[10px] text-muted-foreground">Gas Balance</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem 
          onClick={handleDisconnect}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
