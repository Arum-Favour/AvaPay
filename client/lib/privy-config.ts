import type { PrivyClientConfig } from "@privy-io/react-auth";
import { avalancheFuji } from "wagmi/chains";

/** Must match wagmi `chains` and your Privy dashboard network allowlist. */
export const privyAppConfig: PrivyClientConfig = {
  supportedChains: [avalancheFuji],
  appearance: {
    theme: "dark",
    accentColor: "#3b82f6",
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "all-users",
    },
  },
};
