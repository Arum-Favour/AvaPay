/**
 * Single Vercel serverless entry: handles every request (API + SPA).
 * No path-based routing; one handler avoids 404 / file-not-found issues.
 */
export { default } from "./serverless.mjs";
