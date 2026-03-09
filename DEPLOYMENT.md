# AvaPay Deployment Guide

Step-by-step instructions to deploy AvaPay on **Render** (recommended) and **Vercel** using free tiers.

---

## Prerequisites (both platforms)

1. **GitHub account** – push your code to a GitHub repo
2. **MongoDB Atlas** (free tier) – [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **Strong JWT secret** – e.g. `openssl rand -hex 32`

---

## Part 1: MongoDB Atlas (required for both)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.
2. Create a **free M0 cluster** (e.g. AWS, region closest to you).
3. Under **Database Access** → **Add New Database User**:
   - Create a user with a password (save it).
4. Under **Network Access** → **Add IP Address**:
   - Add `0.0.0.0/0` to allow connections from anywhere (Render/Vercel).
5. Under **Database** → **Connect** → **Connect your application**:
   - Copy the connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/`
6. Replace `<password>` with your user password.
7. Add the database name: `mongodb+srv://.../?retryWrites=true&w=majority` → append `&dbName=avapay` or use `avapay` as the DB name in your app.

---

## Part 2: Deploy on Render (recommended)

Render runs your full Node.js server. No code changes needed.

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/avapay.git
git push -u origin main
```

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com) and sign up (free).
2. **Dashboard** → **New** → **Web Service**.
3. Connect your GitHub account and select the `avapay` repo.
4. Configure:
   - **Name**: `avapay` (or any name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Step 3: Environment Variables

In **Environment** → **Add Environment Variable**, add:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | Your 32+ character secret (e.g. from `openssl rand -hex 32`) |
| `MONGODB_URI` | Your Atlas connection string |
| `MONGODB_DB_NAME` | `avapay` |
| `CORS_ORIGIN` | `https://YOUR_SERVICE_NAME.onrender.com` (replace with your actual Render URL) |
| `NODE_ENV` | `production` |

### Step 4: Deploy

1. Click **Create Web Service**.
2. Wait for the build and deploy (about 3–5 minutes).
3. Your app will be live at `https://YOUR_SERVICE_NAME.onrender.com`.

### Step 5: Update CORS (if needed)

After the first deploy, copy the live URL and update `CORS_ORIGIN` in Environment to match it exactly, then redeploy.

---

## Part 3: Deploy on Vercel

Vercel uses serverless functions for the API and static hosting for the frontend.

### Step 1: Push to GitHub

Same as Render – ensure your code is in a GitHub repo.

### Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign up (free).
2. **Add New** → **Project**.
3. Import your GitHub repo.
4. Vercel will detect `vercel.json` – no need to change framework settings.

### Step 3: Configure Build

In **Project Settings** → **General**:

- **Build Command**: Leave default (uses `vercel.json`: `npm run build && npm run build:serverless`)
- **Output Directory**: `dist/spa` (from `vercel.json`)
- **Install Command**: `npm install` (or `pnpm install` if you use pnpm)

### Step 4: Environment Variables

In **Project Settings** → **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | Your 32+ character secret |
| `MONGODB_URI` | Your Atlas connection string |
| `MONGODB_DB_NAME` | `avapay` |
| `CORS_ORIGIN` | `https://YOUR_PROJECT.vercel.app` (or your custom domain) |

### Step 5: Deploy

1. Click **Deploy**.
2. Wait for the build (about 2–4 minutes).
3. Your app will be live at `https://YOUR_PROJECT.vercel.app`.

### Step 6: Update CORS

After the first deploy, set `CORS_ORIGIN` to your exact Vercel URL (or custom domain) and redeploy.

---

## Summary

| | Render | Vercel |
|---|--------|--------|
| **Best for** | Full-stack Node apps | Frontend + serverless API |
| **Free tier** | 750 hrs/month, sleeps after 15 min | Generous, no sleep |
| **Cold starts** | Yes (after sleep) | Yes (per request) |
| **Setup** | Simpler, runs full server | Uses serverless handler |

---

## Post-deploy checklist

- [ ] `CORS_ORIGIN` matches your live URL exactly
- [ ] MongoDB Atlas allows `0.0.0.0/0` (or your platform’s IPs)
- [ ] `JWT_SECRET` is strong and not committed to git
- [ ] Test: Sign in as employer, deploy vault, add employee, execute payrun
- [ ] Test: Sign in as employee with same wallet, check Employee Portal

---

## Troubleshooting

**Build fails on Vercel**

- Ensure `serverless-http` is in `dependencies` (not only devDependencies).
- Check that `npm run build` and `npm run build:serverless` succeed locally.

**CORS errors**

- Set `CORS_ORIGIN` to the exact URL (including `https://`, no trailing slash).
- Redeploy after changing env vars.

**MongoDB connection fails**

- Verify the connection string and that the user has read/write access.
- Confirm `0.0.0.0/0` is allowed in Network Access.
