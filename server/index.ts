import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import { handleAuthLogout, handleAuthMe, handleAuthNonce, handleAuthVerify, requireAuth, requireRole } from "./auth";
import {
  handleCreateEmployee,
  handleCreatePayrunDraft,
  handleDeleteEmployee,
  handleGetEmployerState,
  handleImportEmployeesCsv,
  handleSetPayrollContract,
  handleSubmitPayrunTx,
  handleUpdateEmployee,
} from "./routes/payroll";
import { handleGetEmployeePortal } from "./routes/employee";

function getCorsAllowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Common Vite dev URLs (page may be opened as localhost while VITE_API_BASE_URL uses a LAN IP, or vice versa)
  const devDefaults = ["http://localhost:8080", "http://127.0.0.1:8080"];
  return [...new Set([...devDefaults, ...fromEnv])];
}

export function createServer() {
  const app = express();

  // Middleware — credentials + cross-origin SPA need an explicit allowlist (cannot use "*")
  const allowedOrigins = getCorsAllowedOrigins();
  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin / server-to-server / curl often omit Origin
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth (SIWE)
  app.get("/api/auth/nonce", handleAuthNonce);
  app.post("/api/auth/verify", handleAuthVerify);
  app.post("/api/auth/logout", handleAuthLogout);
  app.get("/api/auth/me", requireAuth, handleAuthMe);

  // Payroll API (employer)
  app.get("/api/employer/state", requireAuth, requireRole(["employer", "admin"]), handleGetEmployerState);
  app.post("/api/employer/employees", requireAuth, requireRole(["employer", "admin"]), handleCreateEmployee);
  app.post("/api/employer/employees/import", requireAuth, requireRole(["employer", "admin"]), handleImportEmployeesCsv);
  app.patch("/api/employer/employees/:employeeId", requireAuth, requireRole(["employer", "admin"]), handleUpdateEmployee);
  app.delete("/api/employer/employees/:employeeId", requireAuth, requireRole(["employer", "admin"]), handleDeleteEmployee);
  app.post("/api/employer/payroll-contract", requireAuth, requireRole(["employer", "admin"]), handleSetPayrollContract);
  app.post("/api/employer/payruns/draft", requireAuth, requireRole(["employer", "admin"]), handleCreatePayrunDraft);
  app.post("/api/employer/payruns/submit", requireAuth, requireRole(["employer", "admin"]), handleSubmitPayrunTx);

  // Employee portal API
  app.get("/api/employee/portal", requireAuth, requireRole(["employee", "admin"]), handleGetEmployeePortal);

  return app;
}
