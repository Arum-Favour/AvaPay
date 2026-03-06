import type { RequestHandler } from "express";
import { z } from "zod";
import {
  createEmployee,
  createPayrunDraft,
  getCompanyByOwner,
  listEmployees,
  listPayruns,
  submitPayrunTx,
  setCompanyPayrollContract,
} from "../domain";
import type { EmployerStateResponse } from "@shared/api";

export const handleGetEmployerState: RequestHandler = (req, res) => {
  const auth = (req as any).auth as { userId: string } | undefined;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const company = getCompanyByOwner(auth.userId);
  if (!company) return res.status(404).json({ error: "Company not found" });

  const employees = listEmployees(company.id).map((e) => ({
    id: e.id,
    companyId: e.companyId,
    name: e.name,
    title: e.title,
    wallet: e.wallet,
    monthlySalaryUsdc6: e.monthlySalaryUsdCents,
    status: e.status,
    createdAt: e.createdAt,
  }));
  const payruns = listPayruns(company.id).map((p) => ({
    id: p.id,
    companyId: p.companyId,
    tokenAddress: p.tokenAddress,
    totalAmountUsdc6: p.totalAmountUsdCents,
    status: p.status,
    txHash: p.txHash,
    createdAt: p.createdAt,
  }));

  const payload: EmployerStateResponse = {
    company,
    employees,
    payruns,
  };
  res.json(payload);
};

const createEmployeeSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1).optional(),
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  monthlySalaryUsdc6: z.number().int().nonnegative(),
});

export const handleCreateEmployee: RequestHandler = (req, res) => {
  const auth = (req as any).auth as { userId: string } | undefined;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const company = getCompanyByOwner(auth.userId);
  if (!company) return res.status(404).json({ error: "Company not found" });

  const parsed = createEmployeeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });

  const employee = createEmployee({
    companyId: company.id,
    name: parsed.data.name,
    title: parsed.data.title ?? null,
    wallet: parsed.data.wallet,
    monthlySalaryUsdCents: parsed.data.monthlySalaryUsdc6,
  });
  res.json({
    employee: {
      id: employee.id,
      companyId: employee.companyId,
      name: employee.name,
      title: employee.title,
      wallet: employee.wallet,
      monthlySalaryUsdc6: employee.monthlySalaryUsdCents,
      status: employee.status,
      createdAt: employee.createdAt,
    },
  });
};

const setContractSchema = z.object({
  payrollContractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const handleSetPayrollContract: RequestHandler = (req, res) => {
  const auth = (req as any).auth as { userId: string } | undefined;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const company = getCompanyByOwner(auth.userId);
  if (!company) return res.status(404).json({ error: "Company not found" });

  const parsed = setContractSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });

  setCompanyPayrollContract({ companyId: company.id, payrollContractAddress: parsed.data.payrollContractAddress });
  res.json({ ok: true });
};

const createPayrunSchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).nullable().optional(),
});

export const handleCreatePayrunDraft: RequestHandler = (req, res) => {
  const auth = (req as any).auth as { userId: string } | undefined;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const company = getCompanyByOwner(auth.userId);
  if (!company) return res.status(404).json({ error: "Company not found" });

  const parsed = createPayrunSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });

  const out = createPayrunDraft({ companyId: company.id, tokenAddress: parsed.data.tokenAddress ?? null });
  res.json(out);
};

const submitPayrunSchema = z.object({
  payrunId: z.string().min(1),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export const handleSubmitPayrunTx: RequestHandler = (req, res) => {
  const auth = (req as any).auth as { userId: string } | undefined;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const company = getCompanyByOwner(auth.userId);
  if (!company) return res.status(404).json({ error: "Company not found" });

  const parsed = submitPayrunSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });

  submitPayrunTx({ payrunId: parsed.data.payrunId, txHash: parsed.data.txHash });
  res.json({ ok: true });
};

