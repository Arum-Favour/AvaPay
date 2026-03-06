import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import { handleAuthLogout, handleAuthMe, handleAuthNonce, handleAuthVerify, requireAuth, requireRole } from "./auth";
import { handleCreateEmployee, handleCreatePayrunDraft, handleGetEmployerState, handleSetPayrollContract, handleSubmitPayrunTx } from "./routes/payroll";

export function createServer() {
  const app = express();

  // Middleware
  const allowOrigin = process.env.CORS_ORIGIN ?? "http://localhost:8080";
  app.use(
    cors({
      origin: allowOrigin,
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
  app.post("/api/employer/payroll-contract", requireAuth, requireRole(["employer", "admin"]), handleSetPayrollContract);
  app.post("/api/employer/payruns/draft", requireAuth, requireRole(["employer", "admin"]), handleCreatePayrunDraft);
  app.post("/api/employer/payruns/submit", requireAuth, requireRole(["employer", "admin"]), handleSubmitPayrunTx);

  return app;
}
