/**
 * Serverless entry for Vercel. One handler serves both API and SPA (no path/rewrite issues).
 */
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer } from "./index";
import serverless from "serverless-http";

const app = createServer();

// Serve SPA static files (Vercel includes dist/spa via includeFiles)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const spaRoot = path.join(process.cwd(), "dist", "spa");
app.use(express.static(spaRoot));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(spaRoot, "index.html"));
});

export default serverless(app);
