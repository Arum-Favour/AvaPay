import * as React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSignMessage } from "wagmi";
import { toast } from "sonner";
import { useAuth, type AuthProgressStep, type UserRole, type UserProfile } from "@/hooks/use-auth";

export type ProtocolAuthProgress = AuthProgressStep | "idle";

type SignInArgs = {
  role: Exclude<UserRole, null>;
};

type SignUpArgs = {
  role: Exclude<UserRole, null>;
  email: string;
  companyName?: string;
};

export function useProtocolAuth() {
  const { user, signOut, loginWithSiwe, isLoading: serverAuthLoading } = useAuth();
  const { ready: privyReady, authenticated, login, connectWallet } = usePrivy();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [progress, setProgress] = React.useState<ProtocolAuthProgress>("idle");

  const connectAccount = React.useCallback(async () => {
    if (!privyReady) {
      toast.error("Wallet provider is still loading. Try again in a moment.");
      return;
    }
    // Privy will either login the user (if unauthenticated) or just connect/link a wallet.
    if (authenticated) connectWallet();
    else {
      // Prefer a non-web3 friendly login modal (email/social + optional wallet).
      // If you enabled additional login providers in the Privy dashboard, you can
      // expand this list to match them.
      login({ loginMethods: ["email", "wallet", "google", "github"] } as any);
    }
  }, [authenticated, connectWallet, login, privyReady]);

  const signIn = React.useCallback(
    async (args: SignInArgs): Promise<UserProfile> => {
      if (!address) {
        await connectAccount();
        throw new Error("Wallet address not connected");
      }

      setProgress("idle");
      return loginWithSiwe({
        intent: "login",
        role: args.role,
        address,
        signMessageAsync: ({ message }) =>
          signMessageAsync({ account: address as `0x${string}`, message }) as Promise<`0x${string}`>,
        onProgress: setProgress,
      });
    },
    [address, connectAccount, loginWithSiwe, signMessageAsync],
  );

  const signUp = React.useCallback(
    async (args: SignUpArgs): Promise<UserProfile> => {
      if (!address) {
        await connectAccount();
        throw new Error("Wallet address not connected");
      }

      setProgress("idle");
      return loginWithSiwe({
        intent: "signup",
        address,
        role: args.role,
        email: args.email,
        companyName: args.companyName,
        signMessageAsync: ({ message }) =>
          signMessageAsync({ account: address as `0x${string}`, message }) as Promise<`0x${string}`>,
        onProgress: setProgress,
      });
    },
    [address, connectAccount, loginWithSiwe, signMessageAsync],
  );

  const busy = serverAuthLoading || progress !== "idle";

  return {
    user,
    address: address ?? null,
    isWalletConnected: isConnected && !!address,
    progress,
    busy,
    connectAccount,
    signIn,
    signUp,
    signOut,
  };
}

