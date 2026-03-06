## AvaPay (MVP Demo)

Investor-demo ready vertical slice:

- **SIWE auth** (server-verified signature + httpOnly session cookie)
- **Employer dashboard** backed by SQLite (companies, employees, payruns)
- **Smart contracts** (Hardhat) + **UI deploy** on Avalanche Fuji
- **Batch payrun execution** on-chain with tx hash stored as a receipt

### Prereqs

- Node.js 18+
- An Avalanche Fuji funded wallet (for gas)

### Setup

1. Create `.env` from `.env.example` and set:
   - `JWT_SECRET` (required)
   - `CORS_ORIGIN` (default ok for local)

2. Install deps:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

Open `http://localhost:8080`.

### Demo flow (Fuji)

1. **Sign up** as Employer (connect wallet, sign SIWE).
2. Go to **Smart Contracts** and deploy the payroll vault:
   - For best results, deploy with an **ERC20 token address** (mock USDC on Fuji).
3. Go to **Employer Dashboard**:
   - Add employees (wallet + monthly salary in USDC)
   - Click **Create Payrun Draft**
   - Fund the deployed vault contract with enough ERC20 tokens
   - Click **Execute Latest Draft On-chain**
4. The payrun card will show a **Snowtrace tx link** as the receipt.

### Contracts

See `contracts/README.md` for Hardhat deploy scripts (optional if you use the UI deploy).

