/**
 * Vercel serverless catch-all for /api/* routes.
 * Serves the Express API; static SPA is served by Vercel from dist/spa.
 */
export { default } from "../dist/server/serverless.mjs";
