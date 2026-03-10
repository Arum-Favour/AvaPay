/**
 * Vercel serverless handler for all /api/* routes.
 * Rewrites in vercel.json send /api/* here; request path is preserved for Express.
 */
export { default } from "./serverless.mjs";
