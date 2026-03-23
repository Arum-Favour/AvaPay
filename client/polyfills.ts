/**
 * Privy / wallet SDKs sometimes assume Node's `Buffer` exists. Browsers don't
 * provide it — polyfill before any wallet UI runs.
 */
import { Buffer } from "buffer";

if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

// Bundles that reference Node's `global` (e.g. some crypto paths)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (typeof g.global === "undefined") {
  g.global = globalThis;
}
