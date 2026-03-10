/**
 * Vercel serverless catch-all for /api/* routes.
 * Build outputs serverless-handler.mjs into api/ so Vercel deploys it with the function.
 */
export { default } from "./serverless.mjs";
