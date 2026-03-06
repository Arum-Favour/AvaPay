import * as React from "react";
import { useAccount, useDisconnect } from 'wagmi';

export type UserRole = "employer" | "employee" | "admin" | null;

export interface EmployeeData {
  name: string;
  role: string;
  wallet: string;
  salary: string;
  status: "Active" | "Paused";
  lastPayment: string;
}

export interface ObligationData {
  title: string;
  date: string;
  amount: string;
  status: "Pending" | "Upcoming";
}

export interface UserProfile {
  id: string;
  address: string;
  email: string;
  role: UserRole;
  // Role specific:
  companyName?: string; // Employer
  jobTitle?: string;    // Employee
  salary?: string;      // Employee
  treasuryBalance?: string; // Employer
  employees?: EmployeeData[]; // Employer
  obligations?: ObligationData[]; // Employer
}

export interface SystemStats {
  totalVolume: string;
  activeCompanies: string;
  activeStreams: string;
  treasuryLocked: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  systemStats: SystemStats;
  loginWithSiwe: (args: {
    address: string;
    role: Exclude<UserRole, null>;
    email?: string;
    companyName?: string;
    signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>;
  }) => Promise<void>;
  signOut: () => void;
  updateUser: (details: Partial<UserProfile>) => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

const defaultSystemStats: SystemStats = {
  totalVolume: "$12,450,200",
  activeCompanies: "84",
  activeStreams: "1,242",
  treasuryLocked: "$4,820,500",
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isLoading, setIsLoading] = React.useState(true);
  const [systemStats, setSystemStats] = React.useState<SystemStats>(defaultSystemStats);

  React.useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.user) {
          setUser({
            id: data.user.userId,
            address: data.user.address,
            email: "",
            role: data.user.role,
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithSiwe: AuthContextType["loginWithSiwe"] = async (args) => {
    setIsLoading(true);
    try {
      const nonceRes = await fetch("/api/auth/nonce", { credentials: "include" });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();

      const domain = window.location.host;
      const origin = window.location.origin;
      const chainId = 43113; // Fuji for MVP

      const statement = "Sign in to AvaPay to manage payroll on Avalanche.";
      const issuedAt = new Date().toISOString();
      // EIP-4361 (SIWE) formatted message.
      const message =
        `${domain} wants you to sign in with your Ethereum account:\n` +
        `${args.address}\n\n` +
        `${statement}\n\n` +
        `URI: ${origin}\n` +
        `Version: 1\n` +
        `Chain ID: ${chainId}\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${issuedAt}`;
      const signature = await args.signMessageAsync({ message });

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message,
          signature,
          role: args.role,
          email: args.email,
          companyName: args.companyName,
        }),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        throw new Error(err?.error ?? "Auth failed");
      }
      const data = await verifyRes.json();
      const u = data?.user;
      setUser({
        id: u.id,
        address: u.address,
        email: u.email ?? "",
        role: u.role,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (details: Partial<UserProfile>) => {
    if (!user) return;
    const newUser = { ...user, ...details };
    setUser(newUser);
  };

  const signOut = () => {
    setUser(null);
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, systemStats, loginWithSiwe, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
