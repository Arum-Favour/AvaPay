## AvaPay – Fuji Payroll Protocol

AvaPay is a Web3 payroll protocol running on **Avalanche Fuji testnet**.  
Employers deploy a **shared USDC payroll vault**, fund it from their own wallet, and execute **batch monthly payouts** to employees. Employees sign in with their wallet to see **real earnings history** and view the on-chain activity for their address.

### What the app does

- **Authentication & roles**
  - **SIWE auth** with server-side verification and httpOnly session cookies.
  - Roles: **employer**, **employee**, **admin** (MVP uses employer + employee).

- **Employer side**
  - **Company vault**: one `AvaPayBatchPayroll` contract per company, deployed from the UI on **Avalanche Fuji**.
  - **Treasury model**:
    - Payroll asset is hard-wired to **Fuji USDC** (`FUJI_USDC_ADDRESS` in `shared/constants.ts`).
    - Employer funds the vault using their own wallet’s Fuji USDC.
  - **Employer dashboard** (MongoDB-backed):
    - Manage **employees** (name, title, wallet, monthly salary in USDC).
    - Create **payrun drafts** that snapshot all active employees.
    - Execute **batch payruns on-chain**, calling `payBatch` on the vault.
    - Each executed payrun stores a **Snowtrace tx hash** and marks per-employee items as **paid**.

- **Employee side**
  - Employees sign in as `employee` with their wallet (must match the wallet on an employer record).
  - The **Employee Portal** shows:
    - **Lifetime earnings** and **withdrawable balance** calculated only from **paid** payrun items.
    - A **history list** of salary payments, each with timestamp, amount, status, and optional **Snowtrace tx link**.
    - A **“View Wallet Activity”** button that opens the employee’s wallet on Snowtrace so they can see actual on-chain transfers.

- **Smart contracts**
  - `AvaPayBatchPayroll` is a minimal owner-controlled vault:
    - Deployed with `owner = employer wallet` and `token = Fuji USDC`.
    - Employer can:
      - `depositERC20` USDC into the vault.
      - `payBatch(recipients[], amounts[])` to pay employees.
      - `withdraw(to, amount)` to move leftover funds out (owner-only).
  - Vault is **not per-employee** – it is a single company vault; employees receive USDC directly to their wallets.

### How the system works end-to-end

- **1. Employer setup**
  - Connect a Fuji-funded wallet in the UI.
  - Sign in with SIWE as **employer**.
  - This creates/updates a **company record** in Mongo tied to that user.

- **2. Deploy payroll vault**
  - Go to the **Smart Contracts / Deploy** page.
  - Click **“Confirm & Deploy Contract”**:
    - Deploys one `AvaPayBatchPayroll` vault on Fuji with **Fuji USDC** as the token.
    - Persists the deployed contract address on the company in Mongo.

- **3. Add employees & create payrun**
  - Go to the **Employer Dashboard**:
    - Add employees with `wallet` + `monthly salary (USDC)`.
  - Click **“Create Payrun Draft”**:
    - Backend snapshots all active employees into:
      - A `payrun` document (company, total USDC amount).
      - Per-employee `payrunItems` (employee, amount, initial `status = "queued"`).

- **4. Fund vault & execute payrun**
  - Fund the deployed vault with Fuji USDC from the employer’s wallet.
  - Click **“Execute Latest Draft On-chain”**:
    - Frontend calls `payBatch` on the vault using the payrun’s recipients + amounts.
    - On success, backend:
      - Stores the `txHash` on the `payrun`.
      - Marks that payrun as `status = "confirmed"`.
      - Marks all its `payrunItems` as `status = "paid"`.

- **5. Employee view**
  - Employee signs in with SIWE as `employee` using their own wallet.
  - Backend matches that wallet to an `employees` row.
  - Employee Portal shows:
    - **Lifetime earnings** = sum of all **paid** items for that employee.
    - **Withdrawable** = same paid sum (MVP assumes once paid, funds are in the wallet).
    - **History** = list of `payrunItems` with their createdAt, paid amount, effective status, and payrun tx hash (if available).
    - **View Wallet Activity** button opens the wallet on **Snowtrace** (Fuji) so they can verify transfers.

### Cloning & running the app

#### Prerequisites

- **Node.js 18+**
- **pnpm** (recommended) or npm
- **MongoDB** running locally or a MongoDB connection string
- **Avalanche Fuji** test wallet:
  - Funded with **AVAX** (gas) and some **Fuji USDC**.

#### 1. Clone the repo

```bash
git clone <your-repo-url> avapay
cd avapay
```

#### 2. Environment configuration

Create `.env` from `.env.example` in the project root:

- **Required**
  - `JWT_SECRET` – strong secret, at least 32 characters (used for SIWE session JWTs).
  - `MONGODB_URI` – MongoDB connection string.
  - `MONGODB_DB_NAME` – database name (default `avapay` if omitted).
- **Optional**
  - `CORS_ORIGIN` – allowed frontend origin (defaults to `http://localhost:8080`).
  - `AVALANCHE_CHAIN_ID` – defaults to `43113` (Fuji) if not set.

Example:

```bash
JWT_SECRET=replace-with-strong-32+-char-secret
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=avapay
CORS_ORIGIN=http://localhost:8080
AVALANCHE_CHAIN_ID=43113
```

#### 3. Install dependencies

Using **pnpm** (preferred):

```bash
pnpm install
```

Or with npm:

```bash
npm install
```

#### 4. Run the dev server

```bash
pnpm dev
# or
npm run dev
```

This starts both the **Vite React SPA client** and the **Express API server** on a single port (`http://localhost:8080`).

#### 5. Local demo flow (Fuji)

1. **Connect wallet & sign in (employer)**
   - Open `http://localhost:8080`.
   - Click **Sign in** / **Get started**, choose your role as **Employer**, and complete the **SIWE** flow.
   - Make sure your wallet is on **Avalanche Fuji**.

2. **Deploy the company payroll vault**
   - Navigate to the **Smart Contracts** (Deploy) page.
   - Ensure your wallet holds **Fuji USDC**.
   - Click **“Confirm & Deploy Contract”** to deploy the `AvaPayBatchPayroll` vault.

3. **Configure employees & create payrun**
   - Go to the **Employer Dashboard** (`/protocol` for the protocol UI).
   - Add one or more employees with:
     - `Wallet 0x...` (employee Fuji address).
     - `Monthly salary (USDC)` amount.
   - Click **“Create Payrun Draft”** to snapshot employees into a draft payrun.

4. **Fund vault and execute payrun**
   - From your wallet, **fund the deployed vault contract with Fuji USDC** (approve + transfer).
   - Back in the Employer Dashboard, click **“Execute Latest Draft On-chain”**.
   - Once the transaction confirms:
     - The payrun card will show a **Snowtrace tx link**.
     - All associated `payrunItems` are marked **paid**.

5. **Employee experience**
   - Have the employee sign in with SIWE as `employee`, using the same wallet address you configured.
   - Open the **Employee Portal**:
     - Verify **lifetime earnings** and **withdrawable** reflect the executed payruns.
     - Scroll the **History** list for per-payrun entries.
     - Click **“View Wallet Activity”** to open their wallet on Snowtrace (Fuji) and see incoming USDC transfers.

### Contracts

The main vault contract is `contracts/contracts/AvaPayBatchPayroll.sol`.  
For low-level Hardhat usage and CLI deployment, see `contracts/README.md` (optional if you use the UI deploy).

