import * as React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { apiUrl, fetchJson } from "@/lib/api";

export type UserRole = "employer" | "employee" | "admin" | null;

// UI-friendly progress states for account verification.
export type AuthProgressStep = "preparing" | "confirm_wallet" | "confirming_network" | "done";

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

/** SIWE verify: `login` only allows wallets already in DB; `signup` creates/updates the user profile. */
export type LoginWithSiweArgs =
  | {
      intent: "login";
      role: Exclude<UserRole, null>;
      address: string;
      signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>;
      onProgress?: (step: AuthProgressStep) => void;
    }
  | {
      intent: "signup";
      address: string;
      role: Exclude<UserRole, null>;
      email?: string;
      companyName?: string;
      signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>;
      onProgress?: (step: AuthProgressStep) => void;
    };

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  systemStats: SystemStats;
  loginWithSiwe: (args: LoginWithSiweArgs) => Promise<UserProfile>;
  /** Clears server session, Privy session, and wagmi connection. */
  signOut: () => Promise<void>;
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
  const { disconnectAsync } = useDisconnect();
  const { logout } = usePrivy();
  const [isLoading, setIsLoading] = React.useState(true);
  const [systemStats, setSystemStats] = React.useState<SystemStats>(defaultSystemStats);

  React.useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const res = await fetch(apiUrl("/api/auth/me"), { credentials: "include" });
        if (!res.ok) return;
        const ct = res.headers.get("content-type") ?? "";
        const text = await res.text();
        if (!ct.includes("application/json")) {
          console.warn(
            "GET /api/auth/me returned non-JSON (likely HTML). Set VITE_API_BASE_URL if the API is on another host.",
          );
          return;
        }
        const data = JSON.parse(text) as { user?: { userId: string; address: string; role: UserRole } };
        if (!cancelled && data?.user) {
          setUser({
            id: data.user.userId,
            address: data.user.address,
            email: "",
            role: data.user.role,
          });
        }
      } catch {
        /* ignore boot errors */
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
      args.onProgress?.("preparing");
      const { nonce } = await fetchJson<{ nonce: string }>("/api/auth/nonce");

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

      // User confirmation in the wallet UI (modal / embedded wallet).
      args.onProgress?.("confirm_wallet");
      const signature = await args.signMessageAsync({ message });

      const body =
        args.intent === "login"
          ? { message, signature, intent: "login" as const, role: args.role }
          : {
              message,
              signature,
              intent: "signup" as const,
              role: args.role,
              email: args.email,
              companyName: args.companyName,
            };

      // Backend verification step.
      args.onProgress?.("confirming_network");
      const data = await fetchJson<{ user: { id: string; address: string; email?: string; role: UserRole } }>(
        "/api/auth/verify",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const u = data?.user;
      if (!u) throw new Error("Invalid sign-in response from server");
      const profile: UserProfile = {
        id: u.id,
        address: u.address,
        email: u.email ?? "",
        role: u.role,
      };
      setUser(profile);
      args.onProgress?.("done");
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (details: Partial<UserProfile>) => {
    if (!user) return;
    const newUser = { ...user, ...details };
    setUser(newUser);
  };

  const signOut = React.useCallback(async () => {
    setUser(null);
    try {
      await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    // Privy owns the wallet session; wagmi disconnect alone leaves Privy connected.
    try {
      await logout();
    } catch (e) {
      console.warn("[auth] Privy logout:", e);
    }
    try {
      await disconnectAsync();
    } catch (e) {
      console.warn("[auth] wagmi disconnect:", e);
    }
  }, [disconnectAsync, logout]);

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
