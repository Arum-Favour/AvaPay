import { randomUUID } from "node:crypto";
import { getCollections } from "./db";

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

export async function upsertUser(params: { address: string; email?: string | null; role: UserRole }): Promise<DbUser> {
  const { users } = await getCollections();
  const now = Date.now();
  const address = params.address.toLowerCase();

  const id = randomUUID();
  const result = await users.findOneAndUpdate(
    { address },
    {
      $setOnInsert: { id, createdAt: now },
      $set: {
        address,
        email: params.email ?? null,
        role: params.role,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const doc = result.value as { id: string; address: string; email: string | null; role: UserRole; createdAt?: number } | null;
  if (!doc) {
    // Should not happen, but guard anyway
    return { id, address, email: params.email ?? null, role: params.role, createdAt: now };
  }
  return {
    id: doc.id,
    address: doc.address,
    email: doc.email ?? null,
    role: doc.role,
    createdAt: doc.createdAt ?? now,
  };
}

export async function ensureCompanyForOwner(params: { ownerUserId: string; name: string }): Promise<DbCompany> {
  const { companies } = await getCollections();
  const now = Date.now();

  const existing = await companies.findOne<{ id: string; ownerUserId: string; name: string; payrollContractAddress?: string | null; createdAt?: number }>({
    ownerUserId: params.ownerUserId,
  });

  if (existing) {
    if (existing.name !== params.name) {
      await companies.updateOne({ id: existing.id }, { $set: { name: params.name } });
    }
    return {
      id: existing.id,
      ownerUserId: existing.ownerUserId,
      name: params.name,
      payrollContractAddress: existing.payrollContractAddress ?? null,
      createdAt: existing.createdAt ?? now,
    };
  }

  const id = randomUUID();
  await companies.insertOne({
    id,
    ownerUserId: params.ownerUserId,
    name: params.name,
    payrollContractAddress: null,
    createdAt: now,
  });
  return { id, ownerUserId: params.ownerUserId, name: params.name, payrollContractAddress: null, createdAt: now };
}

export async function setCompanyPayrollContract(params: { companyId: string; payrollContractAddress: string }): Promise<void> {
  const { companies } = await getCollections();
  await companies.updateOne(
    { id: params.companyId },
    { $set: { payrollContractAddress: params.payrollContractAddress } },
  );
}

export async function listEmployees(companyId: string): Promise<DbEmployee[]> {
  const { employees } = await getCollections();
  const rows = await employees
    .find<{ id: string; companyId: string; name: string; title?: string | null; wallet: string; monthlySalaryUsdCents: number; status: string; createdAt?: number }>(
      { companyId },
    )
    .sort({ createdAt: -1 })
    .toArray();

  return rows.map((r) => ({
    id: r.id,
    companyId: r.companyId,
    name: r.name,
    title: r.title ?? null,
    wallet: r.wallet,
    monthlySalaryUsdCents: r.monthlySalaryUsdCents,
    status: (r.status === "paused" ? "paused" : "active") as "active" | "paused",
    createdAt: r.createdAt ?? 0,
  }));
}

export async function createEmployee(params: {
  companyId: string;
  name: string;
  title?: string | null;
  wallet: string;
  monthlySalaryUsdCents: number;
}): Promise<DbEmployee> {
  const { employees } = await getCollections();
  const now = Date.now();
  const id = randomUUID();
  const doc = {
    id,
    companyId: params.companyId,
    name: params.name,
    title: params.title ?? null,
    wallet: params.wallet.toLowerCase(),
    monthlySalaryUsdCents: params.monthlySalaryUsdCents,
    status: "active" as const,
    createdAt: now,
  };
  await employees.insertOne(doc);
  return {
    id,
    companyId: params.companyId,
    name: params.name,
    title: params.title ?? null,
    wallet: params.wallet.toLowerCase(),
    monthlySalaryUsdCents: params.monthlySalaryUsdCents,
    status: "active",
    createdAt: now,
  };
}

export async function createPayrunDraft(params: {
  companyId: string;
  tokenAddress: string;
}): Promise<{ payrun: DbPayrun; items: DbPayrunItem[] }> {
  const { payruns, payrunItems } = await getCollections();
  const now = Date.now();
  const payrunId = randomUUID();
  const employees = (await listEmployees(params.companyId)).filter((e) => e.status === "active");

  const total = employees.reduce((acc, e) => acc + e.monthlySalaryUsdCents, 0);
  await payruns.insertOne({
    id: payrunId,
    companyId: params.companyId,
    tokenAddress: params.tokenAddress,
    totalAmountUsdCents: total,
    status: "draft",
    txHash: null,
    createdAt: now,
  });

  const items: DbPayrunItem[] = [];
  for (const e of employees) {
    const id = randomUUID();
    await payrunItems.insertOne({
      id,
      payrunId,
      employeeId: e.id,
      amountUsdCents: e.monthlySalaryUsdCents,
      status: "queued",
      createdAt: now,
    });
    items.push({ id, payrunId, employeeId: e.id, amountUsdCents: e.monthlySalaryUsdCents, status: "queued", createdAt: now });
  }

  return {
    payrun: {
      id: payrunId,
      companyId: params.companyId,
      tokenAddress: params.tokenAddress,
      totalAmountUsdCents: total,
      status: "draft",
      txHash: null,
      createdAt: now,
    },
    items,
  };
}

export async function submitPayrunTx(params: { payrunId: string; txHash: string }): Promise<void> {
  const { payruns, payrunItems } = await getCollections();
  await payruns.updateOne(
    { id: params.payrunId },
    { $set: { status: "confirmed", txHash: params.txHash } },
  );
  await payrunItems.updateMany(
    { payrunId: params.payrunId },
    { $set: { status: "paid" } },
  );
}

export async function listPayruns(companyId: string): Promise<DbPayrun[]> {
  const { payruns } = await getCollections();
  const rows = await payruns
    .find<{ id: string; companyId: string; tokenAddress?: string | null; totalAmountUsdCents: number; status: string; txHash?: string | null; createdAt?: number }>({
      companyId,
    })
    .sort({ createdAt: -1 })
    .toArray();
  return rows.map((r) => ({
    id: r.id,
    companyId: r.companyId,
    tokenAddress: r.tokenAddress ?? null,
    totalAmountUsdCents: r.totalAmountUsdCents,
    status: (r.status as DbPayrun["status"]) ?? "draft",
    txHash: r.txHash ?? null,
    createdAt: r.createdAt ?? 0,
  }));
}

export async function getCompanyByOwner(ownerUserId: string): Promise<DbCompany | null> {
  const { companies } = await getCollections();
  const row = await companies.findOne<{ id: string; ownerUserId: string; name: string; payrollContractAddress?: string | null; createdAt?: number }>({
    ownerUserId,
  });
  if (!row) return null;
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    payrollContractAddress: row.payrollContractAddress ?? null,
    createdAt: row.createdAt ?? 0,
  };
}

