import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

/** Wagmi config must use `createConfig` from `@privy-io/wagmi` when Privy is enabled. */
export const wagmiConfig = createConfig({
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http(),
  },
});
