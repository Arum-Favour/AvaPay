import { randomUUID } from "node:crypto";
import { getDb } from "./db";

export type UserRole = "employer" | "employee" | "admin";

export interface DbUser {
  id: string;
  address: string;
  email: string | null;
  role: UserRole;
  createdAt: number;
}

export interface DbCompany {
  id: string;
  ownerUserId: string;
  name: string;
  payrollContractAddress: string | null;
  createdAt: number;
}

export interface DbEmployee {
  id: string;
  companyId: string;
  name: string;
  title: string | null;
  wallet: string;
  monthlySalaryUsdCents: number;
  status: "active" | "paused";
  createdAt: number;
}

export interface DbPayrun {
  id: string;
  companyId: string;
  tokenAddress: string | null;
  totalAmountUsdCents: number;
  status: "draft" | "submitted" | "confirmed" | "failed";
  txHash: string | null;
  createdAt: number;
}

export interface DbPayrunItem {
  id: string;
  payrunId: string;
  employeeId: string;
  amountUsdCents: number;
  status: "queued" | "paid" | "failed";
  createdAt: number;
}

export function upsertUser(params: { address: string; email?: string | null; role: UserRole }): DbUser {
  const db = getDb();
  const now = Date.now();
  const address = params.address.toLowerCase();

  const existing = db
    .prepare(`SELECT id, address, email, role, created_at FROM users WHERE address = ?`)
    .get(address) as { id: string; address: string; email: string | null; role: string; created_at: number } | undefined;

  if (existing) {
    db.prepare(`UPDATE users SET email = COALESCE(?, email), role = ? WHERE id = ?`).run(
      params.email ?? null,
      params.role,
      existing.id,
    );
    const row = db
      .prepare(`SELECT id, address, email, role, created_at FROM users WHERE id = ?`)
      .get(existing.id) as { id: string; address: string; email: string | null; role: string; created_at: number };
    return { id: row.id, address: row.address, email: row.email, role: row.role as UserRole, createdAt: row.created_at };
  }

  const id = randomUUID();
  db.prepare(`INSERT INTO users (id, address, email, role, created_at) VALUES (?, ?, ?, ?, ?)`).run(
    id,
    address,
    params.email ?? null,
    params.role,
    now,
  );
  return { id, address, email: params.email ?? null, role: params.role, createdAt: now };
}

export function ensureCompanyForOwner(params: { ownerUserId: string; name: string }): DbCompany {
  const db = getDb();
  const now = Date.now();

  const existing = db
    .prepare(`SELECT id, owner_user_id, name, payroll_contract_address, created_at FROM companies WHERE owner_user_id = ?`)
    .get(params.ownerUserId) as
    | { id: string; owner_user_id: string; name: string; payroll_contract_address: string | null; created_at: number }
    | undefined;

  if (existing) {
    if (existing.name !== params.name) {
      db.prepare(`UPDATE companies SET name = ? WHERE id = ?`).run(params.name, existing.id);
    }
    return {
      id: existing.id,
      ownerUserId: existing.owner_user_id,
      name: params.name,
      payrollContractAddress: existing.payroll_contract_address,
      createdAt: existing.created_at,
    };
  }

  const id = randomUUID();
  db.prepare(`INSERT INTO companies (id, owner_user_id, name, payroll_contract_address, created_at) VALUES (?, ?, ?, ?, ?)`).run(
    id,
    params.ownerUserId,
    params.name,
    null,
    now,
  );
  return { id, ownerUserId: params.ownerUserId, name: params.name, payrollContractAddress: null, createdAt: now };
}

export function setCompanyPayrollContract(params: { companyId: string; payrollContractAddress: string }): void {
  const db = getDb();
  db.prepare(`UPDATE companies SET payroll_contract_address = ? WHERE id = ?`).run(params.payrollContractAddress, params.companyId);
}

export function listEmployees(companyId: string): DbEmployee[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, company_id, name, title, wallet, monthly_salary_usdc_cents, status, created_at
       FROM employees WHERE company_id = ? ORDER BY created_at DESC`,
    )
    .all(companyId) as Array<{
    id: string;
    company_id: string;
    name: string;
    title: string | null;
    wallet: string;
    monthly_salary_usdc_cents: number;
    status: string;
    created_at: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    companyId: r.company_id,
    name: r.name,
    title: r.title,
    wallet: r.wallet,
    monthlySalaryUsdCents: r.monthly_salary_usdc_cents,
    status: (r.status === "paused" ? "paused" : "active") as "active" | "paused",
    createdAt: r.created_at,
  }));
}

export function createEmployee(params: {
  companyId: string;
  name: string;
  title?: string | null;
  wallet: string;
  monthlySalaryUsdCents: number;
}): DbEmployee {
  const db = getDb();
  const now = Date.now();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO employees (id, company_id, name, title, wallet, monthly_salary_usdc_cents, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
  ).run(id, params.companyId, params.name, params.title ?? null, params.wallet, params.monthlySalaryUsdCents, now);
  return {
    id,
    companyId: params.companyId,
    name: params.name,
    title: params.title ?? null,
    wallet: params.wallet,
    monthlySalaryUsdCents: params.monthlySalaryUsdCents,
    status: "active",
    createdAt: now,
  };
}

export function createPayrunDraft(params: { companyId: string; tokenAddress?: string | null }): { payrun: DbPayrun; items: DbPayrunItem[] } {
  const db = getDb();
  const now = Date.now();
  const payrunId = randomUUID();
  const employees = listEmployees(params.companyId).filter((e) => e.status === "active");

  const total = employees.reduce((acc, e) => acc + e.monthlySalaryUsdCents, 0);
  db.prepare(
    `INSERT INTO payruns (id, company_id, token_address, total_amount_usdc_cents, status, tx_hash, created_at)
     VALUES (?, ?, ?, ?, 'draft', NULL, ?)`,
  ).run(payrunId, params.companyId, params.tokenAddress ?? null, total, now);

  const insertItem = db.prepare(
    `INSERT INTO payrun_items (id, payrun_id, employee_id, amount_usdc_cents, status, created_at)
     VALUES (?, ?, ?, ?, 'queued', ?)`,
  );

  const items: DbPayrunItem[] = [];
  for (const e of employees) {
    const id = randomUUID();
    insertItem.run(id, payrunId, e.id, e.monthlySalaryUsdCents, now);
    items.push({ id, payrunId, employeeId: e.id, amountUsdCents: e.monthlySalaryUsdCents, status: "queued", createdAt: now });
  }

  return {
    payrun: {
      id: payrunId,
      companyId: params.companyId,
      tokenAddress: params.tokenAddress ?? null,
      totalAmountUsdCents: total,
      status: "draft",
      txHash: null,
      createdAt: now,
    },
    items,
  };
}

export function submitPayrunTx(params: { payrunId: string; txHash: string }): void {
  const db = getDb();
  db.prepare(`UPDATE payruns SET status = 'submitted', tx_hash = ? WHERE id = ?`).run(params.txHash, params.payrunId);
}

export function listPayruns(companyId: string): DbPayrun[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, company_id, token_address, total_amount_usdc_cents, status, tx_hash, created_at
       FROM payruns WHERE company_id = ? ORDER BY created_at DESC`,
    )
    .all(companyId) as Array<{
    id: string;
    company_id: string;
    token_address: string | null;
    total_amount_usdc_cents: number;
    status: string;
    tx_hash: string | null;
    created_at: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    companyId: r.company_id,
    tokenAddress: r.token_address,
    totalAmountUsdCents: r.total_amount_usdc_cents,
    status: (r.status as DbPayrun["status"]) ?? "draft",
    txHash: r.tx_hash,
    createdAt: r.created_at,
  }));
}

export function getCompanyByOwner(ownerUserId: string): DbCompany | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, owner_user_id, name, payroll_contract_address, created_at FROM companies WHERE owner_user_id = ?`)
    .get(ownerUserId) as { id: string; owner_user_id: string; name: string; payroll_contract_address: string | null; created_at: number } | undefined;
  if (!row) return null;
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    payrollContractAddress: row.payroll_contract_address,
    createdAt: row.created_at,
  };
}

