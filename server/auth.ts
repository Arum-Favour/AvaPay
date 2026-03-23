import { randomBytes } from "node:crypto";
import type { RequestHandler } from "express";
import { SiweMessage } from "siwe";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import {
  AUTH_ERROR_ACCOUNT_NOT_REGISTERED,
  AUTH_ERROR_ROLE_MISMATCH,
  AUTH_ERROR_ROLE_PROFILE_MISSING,
} from "../shared/api";
import {
  ensureCompanyForOwner,
  ensureEmployeeProfile,
  getCompanyByOwner,
  getEmployeeProfileByUserId,
  getUserByAddress,
  type UserRole,
  upsertUser,
} from "./domain";

const COOKIE_NONCE = "avapay_nonce";
const COOKIE_SESSION = "avapay_session";

const SESSION_TTL_SECONDS = 60 * 60 * 6; // 6h

function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(raw);
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
}

export const handleAuthNonce: RequestHandler = (_req, res) => {
  const nonce = randomBytes(16).toString("hex");
  res.cookie(COOKIE_NONCE, nonce, { ...cookieOptions(), maxAge: 10 * 60 * 1000 }); // 10m
  res.json({ nonce });
};

const verifyBodySchema = z
  .object({
    message: z.string().min(1),
    signature: z.string().min(1),
    intent: z.enum(["login", "signup"]),
    role: z.enum(["employer", "employee", "admin"]).optional(),
    email: z.string().email().optional(),
    companyName: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.role) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "role is required", path: ["role"] });
    }
  });

export const handleAuthVerify: RequestHandler = async (req, res) => {
  const parsed = verifyBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  const { message, signature, intent, role, email, companyName } = parsed.data;
  const nonceCookie = req.cookies?.[COOKIE_NONCE] as string | undefined;
  if (!nonceCookie) {
    return res.status(401).json({ error: "Missing nonce cookie" });
  }

  let siwe: SiweMessage;
  try {
    siwe = new SiweMessage(message);
  } catch {
    return res.status(400).json({ error: "Invalid SIWE message" });
  }

  try {
    const result = await siwe.verify({
      signature,
      nonce: nonceCookie,
    });
    if (!result.success) return res.status(401).json({ error: "Signature verification failed" });
  } catch {
    return res.status(401).json({ error: "Signature verification failed" });
  }

  const expectedChainId = Number(process.env.AVALANCHE_CHAIN_ID ?? 43113);
  if (siwe.chainId !== expectedChainId) {
    return res.status(401).json({ error: `Wrong network. Expected chainId ${expectedChainId}.` });
  }

  const address = siwe.address.toLowerCase();

  if (intent === "login") {
    if (!role) {
      return res.status(400).json({ error: "role is required for login" });
    }
    const existing = await getUserByAddress(address);
    if (!existing) {
      return res.status(403).json({
        code: AUTH_ERROR_ACCOUNT_NOT_REGISTERED,
        error: "No account for this wallet. Please register first.",
      });
    }
    if (existing.role !== role) {
      return res.status(403).json({
        code: AUTH_ERROR_ROLE_MISMATCH,
        error: `This wallet is registered as ${existing.role}. Please sign in with the correct role.`,
      });
    }
    if (role === "employer") {
      const company = await getCompanyByOwner(existing.id);
      const companyWallet = company?.ownerWalletAddress?.toLowerCase() ?? "";
      if (!company) {
        return res.status(403).json({
          code: AUTH_ERROR_ROLE_PROFILE_MISSING,
          error: "Employer profile is missing or wallet does not match. Please complete employer sign up.",
        });
      }
      if (!companyWallet) {
        await ensureCompanyForOwner({
          ownerUserId: existing.id,
          ownerWalletAddress: address,
          name: company.name,
        });
      } else if (companyWallet !== address) {
        return res.status(403).json({
          code: AUTH_ERROR_ROLE_PROFILE_MISSING,
          error: "Employer profile is missing or wallet does not match. Please complete employer sign up.",
        });
      }
    } else if (role === "employee") {
      const profile = await getEmployeeProfileByUserId(existing.id);
      const profileWallet = profile?.walletAddress?.toLowerCase() ?? "";
      if (!profile || profileWallet !== address) {
        return res.status(403).json({
          code: AUTH_ERROR_ROLE_PROFILE_MISSING,
          error: "Employee profile is missing or wallet does not match. Please complete employee sign up.",
        });
      }
    }
    const user = existing;
    const now = Math.floor(Date.now() / 1000);
    const jwt = await new SignJWT({ sub: user.id, address: user.address, role: user.role })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(now + SESSION_TTL_SECONDS)
      .sign(getJwtSecret());

    res.clearCookie(COOKIE_NONCE, cookieOptions());
    res.cookie(COOKIE_SESSION, jwt, { ...cookieOptions(), maxAge: SESSION_TTL_SECONDS * 1000 });
    res.json({ ok: true, user: { id: user.id, address: user.address, email: user.email, role: user.role } });
    return;
  }

  // signup — create or update profile (role from client is only used here)
  if (!role) {
    return res.status(400).json({ error: "role is required for signup" });
  }
  const user = await upsertUser({ address, email: email ?? null, role: role as UserRole });
  if (user.role === "employer") {
    await ensureCompanyForOwner({
      ownerUserId: user.id,
      ownerWalletAddress: address,
      name: companyName ?? "AvaPay Demo Company",
    });
  } else if (user.role === "employee") {
    await ensureEmployeeProfile({ userId: user.id, walletAddress: address });
  }

  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ sub: user.id, address: user.address, role: user.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(getJwtSecret());

  res.clearCookie(COOKIE_NONCE, cookieOptions());
  res.cookie(COOKIE_SESSION, jwt, { ...cookieOptions(), maxAge: SESSION_TTL_SECONDS * 1000 });
  res.json({ ok: true, user: { id: user.id, address: user.address, email: user.email, role: user.role } });
};

export const handleAuthMe: RequestHandler = (req, res) => {
  const auth = (req as any).auth as { userId: string; address: string; role: UserRole } | undefined;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user: auth });
};

export const handleAuthLogout: RequestHandler = (_req, res) => {
  res.clearCookie(COOKIE_SESSION, cookieOptions());
  res.json({ ok: true });
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.[COOKIE_SESSION] as string | undefined;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const verified = await jwtVerify(token, getJwtSecret());
    const payload = verified.payload as any;
    (req as any).auth = { userId: String(payload.sub), address: String(payload.address), role: payload.role as UserRole };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export function requireRole(roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const auth = (req as any).auth as { role: UserRole } | undefined;
    if (!auth) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(auth.role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}

