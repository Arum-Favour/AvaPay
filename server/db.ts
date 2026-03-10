import { MongoClient, type Collection } from "mongodb";

interface Collections {
  users: Collection;
  companies: Collection;
  employees: Collection;
  payruns: Collection;
  payrunItems: Collection;
}

let collectionsPromise: Promise<Collections> | null = null;

export async function getCollections(): Promise<Collections> {
  if (collectionsPromise) return collectionsPromise;

  collectionsPromise = (async () => {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || "avapay";
    if (!uri) {
      throw new Error("MONGODB_URI must be set to connect to MongoDB");
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);

    const users = db.collection("users");
    const companies = db.collection("companies");
    const employees = db.collection("employees");
    const payruns = db.collection("payruns");
    const payrunItems = db.collection("payrunItems");

    await Promise.all([
      users.createIndex({ address: 1 }, { unique: true }),
      companies.createIndex({ ownerUserId: 1 }, { unique: true }),
      employees.createIndex({ companyId: 1, wallet: 1 }, { unique: true }),
      payruns.createIndex({ companyId: 1, createdAt: -1 }),
      payrunItems.createIndex({ payrunId: 1 }),
      payrunItems.createIndex({ employeeId: 1 }),
    ]);

    return { users, companies, employees, payruns, payrunItems };
  })();

  return collectionsPromise;
}

