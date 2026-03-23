import { MongoClient } from "mongodb";

type EmployeeRow = {
  id: string;
  companyId: string;
  name: string;
  title: string | null;
  wallet: string;
  monthlySalaryUsdCents: number;
  status: string;
  createdAt?: number;
};

async function main() {
  const dryRun = process.argv.includes("--dry-run") || process.argv.includes("--dryrun");

  const uri ="mongodb+srv://Kingson:KavMn5YvwC6STQmT@cluster0.al8mjom.mongodb.net/veewpay?retryWrites=true&w=majority&appName=Cluster0";
  if (!uri) {
    throw new Error("MONGODB_URI must be set to run this migration");
  }

  const dbName = process.env.MONGODB_DB_NAME || "avapay";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const employees = db.collection<EmployeeRow>("employees");
  const payrunItems = db.collection<{ id?: string; payrunId?: string; employeeId: string }>("payrunItems");

  console.log(`[migrate-employees-wallets] Connected to DB: ${dbName}`);

  // 1) Remove the existing case-sensitive uniqueness index on (companyId, wallet)
  //    so we can safely lowercase values even when duplicates differ only by case.
  const existingIndexes = await employees.indexes();
  const indexesToDrop = existingIndexes
    .filter((idx) => {
      const keys = Object.keys((idx as any).key ?? {});
      return Boolean(idx.unique && keys.includes("companyId") && keys.includes("wallet"));
    })
    .map((idx) => idx.name)
    .filter((name) => name && name !== "_id_");

  if (indexesToDrop.length) {
    if (!dryRun) {
      await Promise.all(indexesToDrop.map((name) => employees.dropIndex(name)));
    }
    console.log(`[migrate-employees-wallets] Dropped indexes: ${indexesToDrop.join(", ")}`);
  } else {
    console.log(`[migrate-employees-wallets] No existing unique indexes detected to drop`);
  }

  // 2) Load employees and group by (companyId, walletLower)
  const groups = new Map<string, EmployeeRow[]>();
  const cursor = employees.find({}, { projection: { id: 1, companyId: 1, name: 1, title: 1, wallet: 1, monthlySalaryUsdCents: 1, status: 1, createdAt: 1 } });

  // Note: `for await` works for MongoDB cursors and is memory-friendlier than `toArray()`.
  for await (const row of cursor) {
    const walletLower = String(row.wallet ?? "").toLowerCase();
    if (!walletLower) continue;
    const key = `${row.companyId}:${walletLower}`;
    const list = groups.get(key) ?? [];
    list.push({ ...row, wallet: walletLower });
    groups.set(key, list);
  }

  let duplicateGroups = 0;
  let mergedEmployees = 0;

  // 3) Merge duplicates by updating payrunItems.employeeId to the survivor, then deleting the rest.
  for (const [, list] of groups) {
    if (list.length <= 1) continue;
    duplicateGroups++;

    // Choose survivor:
    // - prefer `active` over `paused`
    // - if tie, prefer newest `createdAt`
    const sorted = list.sort((a, b) => {
      const aActive = a.status !== "paused";
      const bActive = b.status !== "paused";
      if (aActive !== bActive) return aActive ? -1 : 1;
      const aCreated = a.createdAt ?? 0;
      const bCreated = b.createdAt ?? 0;
      return bCreated - aCreated;
    });

    const survivor = sorted[0];
    const toDelete = sorted.slice(1);

    if (dryRun) {
      mergedEmployees += toDelete.length;
      continue;
    }

    for (const dup of toDelete) {
      // Preserve payroll history: payrunItems refer to employees by `employeeId`.
      await payrunItems.updateMany({ employeeId: dup.id }, { $set: { employeeId: survivor.id } });
      await employees.deleteOne({ id: dup.id });
      mergedEmployees++;
    }
  }

  // 4) Normalize wallets to lowercase for all remaining employee documents.
  if (!dryRun) {
    await employees.updateMany({}, [{ $set: { wallet: { $toLower: "$wallet" } } }]);
  }

  // 5) Recreate the case-insensitive unique index.
  if (!dryRun) {
    await employees.createIndex(
      { companyId: 1, wallet: 1 },
      {
        unique: true,
        collation: { locale: "en", strength: 2 },
        name: "employees_companyId_wallet_ci_unique",
      },
    );
  }

  console.log(`[migrate-employees-wallets] duplicateGroups=${duplicateGroups}, mergedEmployees=${mergedEmployees}, dryRun=${dryRun}`);
  await client.close();
}

main().catch((err) => {
  console.error("[migrate-employees-wallets] Failed:", err);
  process.exit(1);
});

