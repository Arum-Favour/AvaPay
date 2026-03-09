/**
 * Serverless entry for Vercel. Exports the Express app wrapped with serverless-http.
 * Do not use for Render / long-running server (use node-build.ts instead).
 */
import { createServer } from "./index";
import serverless from "serverless-http";

const app = createServer();
export default serverless(app);
