import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type Db = Database.Database;

let _db: Db | null = null;

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export function getDb(): Db {
  if (_db) return _db;

  const dataDir = path.join(process.cwd(), "data");
  ensureDir(dataDir);
  const dbPath = path.join(dataDir, "avapay.sqlite");

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      address TEXT NOT NULL UNIQUE,
      email TEXT,
      role TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      payroll_contract_address TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT,
      wallet TEXT NOT NULL,
      monthly_salary_usdc_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS employees_company_wallet_uq ON employees(company_id, wallet);

    CREATE TABLE IF NOT EXISTS payruns (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      token_address TEXT,
      total_amount_usdc_cents INTEGER NOT NULL,
      status TEXT NOT NULL,
      tx_hash TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payrun_items (
      id TEXT PRIMARY KEY,
      payrun_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      amount_usdc_cents INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS payrun_items_payrun_idx ON payrun_items(payrun_id);
  `);

  _db = db;
  return db;
}

