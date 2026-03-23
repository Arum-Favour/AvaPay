/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export type UserRole = "employer" | "employee" | "admin";

/** Returned in JSON `code` when POST /api/auth/verify has intent=login but no user exists for the wallet */
export const AUTH_ERROR_ACCOUNT_NOT_REGISTERED = "ACCOUNT_NOT_REGISTERED" as const;
/** Returned when wallet exists but not for the selected sign-in role. */
export const AUTH_ERROR_ROLE_MISMATCH = "AUTH_ROLE_MISMATCH" as const;
/** Returned when role-specific profile data is missing for selected sign-in role. */
export const AUTH_ERROR_ROLE_PROFILE_MISSING = "AUTH_ROLE_PROFILE_MISSING" as const;

/**
 * Returned in JSON `code` when an authenticated employer user has not yet set up their employer/company profile.
 * Employer UI should show a "complete setup / sign up" prompt instead of silently creating random records.
 */
export const EMPLOYER_ERROR_COMPANY_NOT_SETUP = "EMPLOYER_COMPANY_NOT_SETUP" as const;

export interface ApiCompany {
  id: string;
  ownerUserId: string;
  ownerWalletAddress: string;
  name: string;
  payrollContractAddress: string | null;
  createdAt: number;
}

export interface ApiEmployee {
  id: string;
  companyId: string;
  name: string;
  title: string | null;
  wallet: string;
  monthlySalaryUsdc6: number; // USDC with 6 decimals (micro-units)
  status: "active" | "paused";
  createdAt: number;
}

export interface ApiPayrun {
  id: string;
  companyId: string;
  tokenAddress: string | null;
  totalAmountUsdc6: number;
  status: "draft" | "submitted" | "confirmed" | "failed";
  txHash: string | null;
  createdAt: number;
}

export interface EmployerStateResponse {
  company: ApiCompany;
  employees: ApiEmployee[];
  payruns: ApiPayrun[];
}

export interface CreateEmployeeRequest {
  name: string;
  title?: string;
  wallet: `0x${string}`;
  monthlySalaryUsdc6: number;
}

export interface EmployeeHistoryItem {
  id: string;
  amountUsdc6: number;
  status: "queued" | "paid" | "failed";
  createdAt: number;
  txHash: string | null;
}

export interface EmployeePortalResponse {
  employee: ApiEmployee | null;
  lifetimeEarningsUsdc6: number;
  withdrawableUsdc6: number;
  history: EmployeeHistoryItem[];
}

