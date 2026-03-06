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

export interface ApiCompany {
  id: string;
  ownerUserId: string;
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

