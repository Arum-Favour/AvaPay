import type { RequestHandler } from "express";
import { getCollections } from "../db";
import type { EmployeePortalResponse } from "@shared/api";

export const handleGetEmployeePortal: RequestHandler = async (req, res) => {
  const auth = (req as any).auth as { address: string } | undefined;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const address = auth.address.toLowerCase();

  const { employees, payruns, payrunItems } = await getCollections();

  const employeeRow = await employees.findOne<{
    id: string;
    companyId: string;
    name: string;
    title?: string | null;
    wallet: string;
    monthlySalaryUsdCents: number;
    status: string;
    createdAt?: number;
  }>({ wallet: address.toLowerCase() });

  if (!employeeRow) {
    const empty: EmployeePortalResponse = {
      employee: null,
      lifetimeEarningsUsdc6: 0,
      withdrawableUsdc6: 0,
      history: [],
    };
    res.json(empty);
    return;
  }

  const items = await payrunItems
    .find<{
      id: string;
      payrunId: string;
      employeeId: string;
      amountUsdCents: number;
      status: string;
      createdAt?: number;
    }>({ employeeId: employeeRow.id })
    .sort({ createdAt: -1 })
    .toArray();

  const payrunIds = Array.from(new Set(items.map((i) => i.payrunId)));
  const payrunRows = payrunIds.length
    ? await payruns
        .find<{ id: string; txHash?: string | null }>({
          id: { $in: payrunIds },
        })
        .toArray()
    : [];

  const payrunById = new Map(payrunRows.map((p) => [p.id, p]));

  let lifetimeEarningsUsdc6 = 0;
  let withdrawableUsdc6 = 0;

  const history = items.map((item) => {
    const amountUsdc6 = item.amountUsdCents;
    const effectiveStatus =
      item.status === "paid" || item.status === "failed" ? item.status : "queued";

    if (effectiveStatus === "paid") {
      lifetimeEarningsUsdc6 += amountUsdc6;
      withdrawableUsdc6 += amountUsdc6;
    }

    const pr = payrunById.get(item.payrunId);
    return {
      id: item.id,
      amountUsdc6,
      status: effectiveStatus as "queued" | "paid" | "failed",
      createdAt: item.createdAt ?? 0,
      txHash: pr?.txHash ?? null,
    };
  });

  const payload: EmployeePortalResponse = {
    employee: {
      id: employeeRow.id,
      companyId: employeeRow.companyId,
      name: employeeRow.name,
      title: employeeRow.title ?? null,
      wallet: employeeRow.wallet,
      monthlySalaryUsdc6: employeeRow.monthlySalaryUsdCents,
      status: (employeeRow.status === "paused" ? "paused" : "active") as "active" | "paused",
      createdAt: employeeRow.createdAt ?? 0,
    },
    lifetimeEarningsUsdc6,
    withdrawableUsdc6,
    history,
  };

  res.json(payload);
};

