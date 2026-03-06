## AvaPay Contracts (MVP)

This folder contains the Hardhat project for the MVP contract used by the app.

### Setup

Create a `.env` in the repo root (or export env vars) with:

- `FUJI_RPC_URL`
- `DEPLOYER_PRIVATE_KEY` (Fuji-funded)
- Optional: `PAYROLL_TOKEN_ADDRESS` (ERC20). If omitted, deploys native AVAX payout vault.

### Commands

From repo root:

```bash
cd contracts
npm install
npm run compile
npm run deploy:fuji
```

