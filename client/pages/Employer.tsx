import * as React from "react";
import Layout from "@/components/Layout";
import { 
  Building2, 
  Download, 
  FileUp,
  Plus, 
  Wallet, 
  MoreVertical, 
  CircleDot,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Search,
  Users,
  Calendar,
  Pencil,
  Trash2,
  Zap,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import type { EmployerStateResponse } from "@shared/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWalletClient, useReadContracts, useReadContract } from "wagmi";
import { avalancheFuji } from "viem/chains";
import { formatUnits } from "viem";
import { avapayBatchPayrollAbi } from "@/lib/contracts/avapayBatchPayroll";
import { FUJI_USDC_ADDRESS } from "@shared/constants";
import { ApiError, EMPLOYER_ERROR_COMPANY_NOT_SETUP, fetchJson } from "@/lib/api";

const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "balance", type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "remaining", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

function formatUsdc(usdc6: number) {
  return (usdc6 / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseUsdcToUsdc6(input: string): bigint | null {
  const s = input.trim();
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [intPart, fracPart = ""] = s.split(".");
  const frac = (fracPart + "000000").slice(0, 6);
  return BigInt(intPart) * 1_000_000n + BigInt(frac);
}

function formatUsdc6Bigint(usdc6: bigint): string {
  const intPart = usdc6 / 1_000_000n;
  const frac = usdc6 % 1_000_000n; // 0..999999
  const twoDec = frac / 10_000n; // 2 decimals
  return `${intPart.toString()}.${twoDec.toString().padStart(2, "0")}`;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

/** Normalize header cell for matching (handles spaces, BOM, Excel quirks). */
function normalizeCsvHeaderCell(h: string): string {
  return h
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\s_\-()]/g, "")
    .trim();
}

/**
 * Parse monthly salary to USDC micro-units. Handles Excel-style thousands (2,500.00),
 * currency symbols, and plain decimals.
 */
function parseMonthlySalaryToUsdc6(raw: string): { ok: true; value: number } | { ok: false; reason: string } {
  let s = raw.trim().replace(/^\$/, "").replace(/\s/g, "");
  if (!s) return { ok: false, reason: "salary is empty" };

  // Heuristic: if last comma is after last dot → European (1.234,56), else US (1,234.56)
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }

  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, reason: `invalid salary "${raw}"` };
  }
  return { ok: true, value: Math.round(n * 1_000_000) };
}

function escapeCsvCell(value: string) {
  const s = value ?? "";
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatUsdc6ToCsv(usdc6: number): string {
  // Convert micro-units (1e6) to a dot-decimal USDC string with 2 decimals, e.g. 2500.50
  const whole = Math.floor(usdc6 / 1_000_000);
  const frac2 = Math.floor((usdc6 - whole * 1_000_000) / 10_000); // 0..99
  return `${whole}.${frac2.toString().padStart(2, "0")}`;
}

function downloadEmployeesCsv(
  rows: Array<{ name: string; title?: string | null; wallet: string; monthlySalaryUsdc6: number }>,
  filename = "avapay-employees.csv",
) {
  const header = ["name", "role", "wallet", "monthlySalary"].join(",");
  const lines = rows.map((e) =>
    [
      escapeCsvCell(e.name),
      escapeCsvCell(e.title ?? ""),
      escapeCsvCell(e.wallet?.toLowerCase() ?? ""),
      formatUsdc6ToCsv(e.monthlySalaryUsdc6),
    ].join(","),
  );

  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Employer() {
  const { user } = useAuth();
  const { address: employerAddress } = useAccount();
  const qc = useQueryClient();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const treasuryUsdc = useReadContracts({
    contracts: employerAddress
      ? ([
          { address: FUJI_USDC_ADDRESS as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [employerAddress as `0x${string}`], chainId: avalancheFuji.id },
          { address: FUJI_USDC_ADDRESS as `0x${string}`, abi: erc20Abi, functionName: "decimals", chainId: avalancheFuji.id },
        ] as const)
      : ([] as const),
    query: { enabled: !!employerAddress },
  });
  const treasuryBalanceUsdc6 =
    treasuryUsdc.data?.[0]?.result != null && treasuryUsdc.data?.[1]?.result != null
      ? Number(formatUnits(treasuryUsdc.data[0].result as bigint, treasuryUsdc.data[1].result as number)) * 1_000_000
      : 0;

  const employerState = useQuery({
    queryKey: ["employer-state"],
    queryFn: async (): Promise<EmployerStateResponse> => {
      return fetchJson<EmployerStateResponse>("/api/employer/state");
    },
    enabled: !!user,
  });

  const contractAddress = employerState.data?.company?.payrollContractAddress ?? null;
  const { data: vaultBalanceWei, refetch: refetchVaultBalance } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: avapayBatchPayrollAbi,
    functionName: "balance",
    chainId: avalancheFuji.id,
    query: { enabled: !!contractAddress },
  });
  const vaultBalanceUsdc6 = vaultBalanceWei != null ? Number(vaultBalanceWei) : 0;

  const { data: usdcAllowanceWei, refetch: refetchUsdcAllowance } = useReadContract({
    address: FUJI_USDC_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: employerAddress && contractAddress ? [employerAddress as `0x${string}`, contractAddress as `0x${string}`] : undefined,
    chainId: avalancheFuji.id,
    query: { enabled: !!employerAddress && !!contractAddress },
  });
  const usdcAllowanceUsdc6 = usdcAllowanceWei ?? 0n;

  type FundingPhase = "idle" | "preparing" | "confirm_wallet" | "confirming_network" | "done";
  const [fundAmountInput, setFundAmountInput] = React.useState<string>("");
  const [fundPhase, setFundPhase] = React.useState<FundingPhase>("idle");

  const createEmployee = useMutation({
    mutationFn: async (input: { name: string; title?: string; wallet: string; monthlySalaryUsdc: string }) => {
      const monthlySalaryUsdc6 = Math.round(Number(input.monthlySalaryUsdc) * 1_000_000);
      const res = await fetch("/api/employer/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: input.name,
          title: input.title,
          wallet: input.wallet,
          monthlySalaryUsdc6,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to create employee");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Employee added");
      qc.invalidateQueries({ queryKey: ["employer-state"] });
    },
    onError: (e: any) => toast.error("Add employee failed", { description: e?.message ?? String(e) }),
  });

  const csvInputRef = React.useRef<HTMLInputElement | null>(null);

  const importEmployeesCsv = useMutation({
    mutationFn: async (rows: Array<{ name: string; role: string; wallet: string; monthlySalaryUsdc6: number }>) => {
      const res = await fetch("/api/employer/employees/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to import CSV");
      }
      return res.json();
    },
    onSuccess: (out: any) => {
      toast.success(`Imported ${out?.imported ?? 0} employee(s)`);
      qc.invalidateQueries({ queryKey: ["employer-state"] });
    },
    onError: (e: any) => toast.error("CSV import failed", { description: e?.message ?? String(e) }),
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (input: {
      employeeId: string;
      name: string;
      role: string;
      wallet: string;
      monthlySalaryUsdc6: number;
    }) => {
      const res = await fetch(`/api/employer/employees/${input.employeeId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: input.name,
          role: input.role,
          wallet: input.wallet,
          monthlySalaryUsdc6: input.monthlySalaryUsdc6,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to update employee");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Employee updated");
      qc.invalidateQueries({ queryKey: ["employer-state"] });
    },
    onError: (e: any) => toast.error("Update failed", { description: e?.message ?? String(e) }),
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await fetch(`/api/employer/employees/${employeeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to delete employee");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Employee deleted");
      qc.invalidateQueries({ queryKey: ["employer-state"] });
    },
    onError: (e: any) => toast.error("Delete failed", { description: e?.message ?? String(e) }),
  });

  const [newName, setNewName] = React.useState("");
  const [newTitle, setNewTitle] = React.useState("");
  const [newWallet, setNewWallet] = React.useState("");
  const [newSalary, setNewSalary] = React.useState("");

  const createPayrunDraft = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/employer/payruns/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to create payrun");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payrun draft created");
      qc.invalidateQueries({ queryKey: ["employer-state"] });
    },
    onError: (e: any) => toast.error("Create payrun failed", { description: e?.message ?? String(e) }),
  });

  const executeLatestDraft = useMutation({
    mutationFn: async () => {
      const state = employerState.data;
      if (!state) throw new Error("Employer state not loaded");
      if (!state.company.payrollContractAddress) throw new Error("No payroll contract set. Deploy one in Smart Contracts.");
      if (!walletClient || !publicClient) throw new Error("Connect wallet");

      const draft = [...state.payruns].find((p) => p.status === "draft");
      if (!draft) throw new Error("No draft payrun found. Create one first.");

      const recipients = state.employees.filter((e) => e.status === "active").map((e) => e.wallet as `0x${string}`);
      const amounts = state.employees.filter((e) => e.status === "active").map((e) => BigInt(e.monthlySalaryUsdc6));
      if (recipients.length === 0) throw new Error("No active employees to pay.");

      const vaultBal = await publicClient.readContract({
        address: state.company.payrollContractAddress as `0x${string}`,
        abi: avapayBatchPayrollAbi,
        functionName: "balance",
        // wagmi v3/v4 typing requires `authorizationList` for readContract params
        authorizationList: [],
      });
      const required = draft.totalAmountUsdc6;
      if (vaultBal < BigInt(required)) {
        throw new Error(
          `Vault has insufficient USDC. Deposit at least ${formatUsdc(required)} USDC into the vault first (approve + depositERC20 on the contract). Current vault: ${formatUsdc(Number(vaultBal))} USDC.`
        );
      }

      const hash = await walletClient.writeContract({
        chain: avalancheFuji,
        account: walletClient.account,
        address: state.company.payrollContractAddress as `0x${string}`,
        abi: avapayBatchPayrollAbi,
        functionName: "payBatch",
        args: [recipients, amounts],
      });

      await fetch("/api/employer/payruns/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payrunId: draft.id, txHash: hash }),
      }).catch(() => {});

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onSuccess: (hash) => {
      toast.success("Payrun executed", { description: hash });
      qc.invalidateQueries({ queryKey: ["employer-state"] });
    },
    onError: (e: any) => toast.error("Execution failed", { description: e?.message ?? String(e) }),
  });

  const fundingBusy = fundPhase !== "idle" && fundPhase !== "done";

  const approveAndDeposit = async (amountUsdc6: bigint) => {
    if (!walletClient || !publicClient) throw new Error("Connect wallet");
    if (!contractAddress) throw new Error("No payroll contract set. Deploy one in Smart Contracts.");
    if (!employerAddress) throw new Error("Connect wallet");
    if (amountUsdc6 <= 0n) throw new Error("Enter a valid amount");
    if (amountUsdc6 > BigInt(treasuryBalanceUsdc6)) throw new Error("Insufficient treasury balance");

    const contractAddr = contractAddress as `0x${string}`;
    const ownerAddr = employerAddress as `0x${string}`;

    // Step 1: Approve ERC20 spending to the payroll vault contract (required by the contract flow).
    if (usdcAllowanceUsdc6 < amountUsdc6) {
      setFundPhase("preparing");
      setFundPhase("confirm_wallet");
      const approveHash = await walletClient.writeContract({
        chain: avalancheFuji,
        account: walletClient.account,
        address: FUJI_USDC_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddr, amountUsdc6],
      });
      setFundPhase("confirming_network");
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      setFundPhase("done");
      toast.success("USDC approved", { description: approveHash });
      await refetchUsdcAllowance();
      setFundPhase("idle");
    }

    // Step 2: Deposit USDC into the payroll vault contract.
    setFundPhase("preparing");
    setFundPhase("confirm_wallet");
    const depositHash = await walletClient.writeContract({
      chain: avalancheFuji,
      account: walletClient.account,
      address: contractAddr,
      abi: avapayBatchPayrollAbi,
      functionName: "depositERC20",
      args: [amountUsdc6],
    });
    setFundPhase("confirming_network");
    await publicClient.waitForTransactionReceipt({ hash: depositHash });
    setFundPhase("done");
    toast.success("Vault funded", { description: depositHash });
    await refetchVaultBalance();
    await refetchUsdcAllowance();
    qc.invalidateQueries({ queryKey: ["employer-state"] });
    setFundPhase("idle");
  };

  if (!user) return null;

  const employerSetupMissing =
    employerState.isError &&
    employerState.error instanceof ApiError &&
    employerState.error.code === EMPLOYER_ERROR_COMPANY_NOT_SETUP;

  const companyName = employerState.data?.company?.name || "Your Company";
  const employees = employerState.data?.employees ?? [];
  const employeePageSize = 15;
  const [employeeSearch, setEmployeeSearch] = React.useState("");
  const [employeePage, setEmployeePage] = React.useState(0);

  const filteredEmployees = React.useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const name = e.name?.toLowerCase() ?? "";
      const title = e.title?.toLowerCase() ?? "";
      const wallet = e.wallet?.toLowerCase() ?? "";
      return name.includes(q) || title.includes(q) || wallet.includes(q);
    });
  }, [employees, employeeSearch]);

  const employeePageCount = Math.ceil(filteredEmployees.length / employeePageSize);
  React.useEffect(() => {
    if (employeePageCount === 0) {
      if (employeePage !== 0) setEmployeePage(0);
      return;
    }
    if (employeePage > employeePageCount - 1) setEmployeePage(employeePageCount - 1);
  }, [employeePageCount, employeePage]);

  const paginatedEmployees = React.useMemo(() => {
    const start = employeePage * employeePageSize;
    return filteredEmployees.slice(start, start + employeePageSize);
  }, [employeePage, employeePageSize, filteredEmployees]);

  const totalMonthly = employees.filter((e) => e.status === "active").reduce((acc, e) => acc + e.monthlySalaryUsdc6, 0);
  const draftPayrun = employerState.data?.payruns?.find((p) => p.status === "draft");
  const draftTotalUsdc6 = draftPayrun?.totalAmountUsdc6 ?? 0;
  const vaultHasEnough = vaultBalanceUsdc6 >= draftTotalUsdc6;

  const vaultShortfallUsdc6 = draftPayrun && !vaultHasEnough ? draftTotalUsdc6 - vaultBalanceUsdc6 : 0;

  React.useEffect(() => {
    if (fundAmountInput.trim()) return;
    if (vaultShortfallUsdc6 > 0) {
      setFundAmountInput((vaultShortfallUsdc6 / 1_000_000).toFixed(2));
    }
  }, [vaultShortfallUsdc6]);

  const fundAmountUsdc6Bigint = parseUsdcToUsdc6(fundAmountInput) ?? 0n;
  const needsApproval = contractAddress ? usdcAllowanceUsdc6 < fundAmountUsdc6Bigint : true;
  const canFundVault =
    !!contractAddress && fundAmountUsdc6Bigint > 0n && fundAmountUsdc6Bigint <= BigInt(treasuryBalanceUsdc6);

  const treasuryDisplay =
    treasuryUsdc.isLoading
      ? "Loading…"
      : `${formatUsdc(Math.round(treasuryBalanceUsdc6))} USDC`;

  const handleCsvSelected = async (file: File | null) => {
    if (!file) return;
    let text = await file.text();
    // UTF-8 BOM from Excel / some editors
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/\r$/, "").trimEnd())
      .filter((l) => l.replace(/\uFEFF/g, "").trim().length > 0);
    if (lines.length < 2) {
      toast.error("CSV must include a header and at least one data row");
      return;
    }
    const headerCells = parseCsvLine(lines[0]).map((h) => normalizeCsvHeaderCell(h));
    const findCol = (candidates: string[]) => {
      for (const c of candidates) {
        const j = headerCells.indexOf(c);
        if (j >= 0) return j;
      }
      return -1;
    };
    const nameIdx = findCol(["name", "fullname", "employeename"]);
    const roleIdx = findCol(["role", "title", "jobtitle"]);
    const walletIdx = findCol(["wallet", "walletaddress", "address"]);
    let salaryIdx = findCol(["monthlysalary", "monthlypay", "salary"]);
    if (salaryIdx < 0) {
      salaryIdx = headerCells.findIndex((h) => h.includes("salary") || h.includes("monthly"));
    }
    if (nameIdx < 0 || roleIdx < 0 || walletIdx < 0 || salaryIdx < 0) {
      toast.error(
        "CSV header must include columns: name, role, wallet, monthlySalary",
      );
      return;
    }
    const rows: Array<{ name: string; role: string; wallet: string; monthlySalaryUsdc6: number }> = [];
    for (let i = 1; i < lines.length; i++) {
      const lineNo = i + 1; // 1-based line number in file (including header)
      const cols = parseCsvLine(lines[i]);
      const name = (cols[nameIdx] ?? "").trim();
      const role = (cols[roleIdx] ?? "").trim();
      const wallet = (cols[walletIdx] ?? "").trim().replace(/^"|"$/g, "").toLowerCase();
      const salaryRaw = (cols[salaryIdx] ?? "").trim();
      // Skip completely empty rows (Excel often adds trailing blank lines)
      if (!name && !role && !wallet && !salaryRaw) continue;
      if (!name || !role) {
        toast.error(`Row ${lineNo}: name and role are required`);
        return;
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        toast.error(`Row ${lineNo}: invalid wallet (expected 0x + 40 hex chars). Got: ${wallet.slice(0, 20)}…`);
        return;
      }
      const salaryParsed = parseMonthlySalaryToUsdc6(salaryRaw);
      if (salaryParsed.ok === false) {
        toast.error(`Row ${lineNo}: ${salaryParsed.reason}. Use a number like 2500 or 2500.50 (commas as thousands are OK).`);
        return;
      }
      rows.push({ name, role, wallet, monthlySalaryUsdc6: salaryParsed.value });
    }
    if (!rows.length) {
      toast.error("No data rows found (only empty lines after the header?)");
      return;
    }
    await importEmployeesCsv.mutateAsync(rows);
  };

  const handleEditEmployee = async (employee: EmployerStateResponse["employees"][number]) => {
    const name = window.prompt("Employee name", employee.name);
    if (name == null) return;
    const role = window.prompt("Employee role/title", employee.title ?? "");
    if (role == null) return;
    const wallet = window.prompt("Wallet address", employee.wallet);
    if (wallet == null) return;
    const salary = window.prompt(
      "Monthly salary (USDC)",
      (employee.monthlySalaryUsdc6 / 1_000_000).toString(),
    );
    if (salary == null) return;
    const monthlySalaryUsdc6 = Math.round(Number(salary) * 1_000_000);
    if (!name.trim() || !role.trim() || !/^0x[a-f0-9]{40}$/i.test(wallet.trim()) || !Number.isFinite(monthlySalaryUsdc6) || monthlySalaryUsdc6 < 0) {
      toast.error("Invalid employee details");
      return;
    }
    await updateEmployeeMutation.mutateAsync({
      employeeId: employee.id,
      name: name.trim(),
      role: role.trim(),
      wallet: wallet.trim().toLowerCase(),
      monthlySalaryUsdc6,
    });
  };

  const handleDeleteEmployee = async (employee: EmployerStateResponse["employees"][number]) => {
    const ok = window.confirm(`Delete employee ${employee.name}?`);
    if (!ok) return;
    await deleteEmployeeMutation.mutateAsync(employee.id);
  };

  return (
    <Layout>
      {employerSetupMissing ? (
        <div className="space-y-6 p-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Employer set up required</h1>
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3">
            <p className="text-muted-foreground">
              Your employer profile isn’t set up yet. To continue, please complete sign up.
            </p>
            <div className="flex gap-3">
              <a href="/signup">
                <Button className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  Complete sign up
                </Button>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Enterprise Dashboard</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-glow">{companyName}</h1>
              <p className="text-muted-foreground">Managing payroll infrastructure on Avalanche C-Chain.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => downloadEmployeesCsv(filteredEmployees)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0] ?? null;
                await handleCsvSelected(file);
                e.currentTarget.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
              onClick={() => csvInputRef.current?.click()}
              disabled={importEmployeesCsv.isPending}
            >
              <FileUp className="mr-2 h-4 w-4" />
              {importEmployeesCsv.isPending ? "Importing..." : "Import CSV"}
            </Button>
              <Button
                onClick={() => {
                  const wallet = newWallet.trim();
                  if (!wallet) return toast.error("Enter employee wallet");
                  createEmployee.mutate({
                    name: newName,
                    title: newTitle || undefined,
                    wallet: wallet.toLowerCase(),
                    monthlySalaryUsdc: newSalary,
                  });
                }}
                disabled={createEmployee.isPending}
                className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                {createEmployee.isPending ? "Adding..." : "Add Employee"}
              </Button>
            </div>
          </div>

        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input placeholder="Employee name" className="rounded-xl bg-white/5 border-white/10" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Title (optional)" className="rounded-xl bg-white/5 border-white/10" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <Input placeholder="Wallet 0x..." className="rounded-xl bg-white/5 border-white/10 font-mono" value={newWallet} onChange={(e) => setNewWallet(e.target.value)} />
              <Input placeholder="Monthly salary (USDC)" type="number" className="rounded-xl bg-white/5 border-white/10" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} />
            </div>
            <div className="text-xs text-muted-foreground">
              Payroll contract:{" "}
              <span className="font-mono text-foreground">{contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : "Not set (deploy one in Smart Contracts)"}</span>
            </div>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
              onClick={() => createPayrunDraft.mutate()}
              disabled={createPayrunDraft.isPending}
            >
              {createPayrunDraft.isPending ? "Creating..." : "Create Payrun Draft"}
            </Button>
            <Button
              className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={() => executeLatestDraft.mutate()}
              disabled={executeLatestDraft.isPending || (!!draftPayrun && !vaultHasEnough)}
              title={draftPayrun && !vaultHasEnough ? `Fund vault with at least ${formatUsdc(draftTotalUsdc6)} USDC first (depositERC20)` : undefined}
            >
              <Zap className="mr-2 h-4 w-4" />
              {executeLatestDraft.isPending ? "Executing..." : draftPayrun && !vaultHasEnough ? "Fund vault first" : "Execute Latest Draft On-chain"}
            </Button>
          </div>
        </div>

        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Treasury Balance */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-8 flex flex-col justify-between group hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Treasury Balance</h3>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-extrabold">{treasuryDisplay}</p>
                  <div className="flex items-center gap-1 text-emerald-500 text-sm font-bold pb-1">
                    <TrendingUp className="h-4 w-4" />
                    Your wallet
                  </div>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Wallet className="h-7 w-7" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Vault balance</span>
                <p className="text-sm font-bold">{contractAddress ? `${formatUsdc(Math.round(vaultBalanceUsdc6))} USDC` : "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Required for payrun</span>
                <p className={cn("text-sm font-bold", draftTotalUsdc6 > 0 && vaultBalanceUsdc6 < draftTotalUsdc6 && "text-amber-500")}>
                  {draftTotalUsdc6 > 0 ? `${formatUsdc(draftTotalUsdc6)} USDC` : "—"}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
                <div className="flex items-center justify-end gap-1.5">
                  {draftPayrun && !vaultHasEnough ? (
                    <span className="text-sm font-bold text-amber-500">Fund vault first</span>
                  ) : (
                    <>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-sm font-bold">Ready</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Fund Vault Section */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Fund payroll vault</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Deposit USDC into your payroll vault. If allowance is missing, we will request an approval first.
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>

              {!contractAddress ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">No payroll contract set yet. Deploy one in `Smart Contracts` first.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">Allowance</span>
                    <span className="font-bold">
                      {formatUsdc6Bigint(usdcAllowanceUsdc6)} USDC
                    </span>
                  </div>

                  {draftPayrun && !vaultHasEnough ? (
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <p className="text-[11px] text-muted-foreground">
                        Vault shortfall:{" "}
                        <span className="font-bold text-amber-500">
                          {formatUsdc(vaultShortfallUsdc6)} USDC
                        </span>
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Deposit amount (USDC)</p>
                    <div className="flex items-center gap-3">
                      <Input
                        value={fundAmountInput}
                        onChange={(e) => setFundAmountInput(e.target.value)}
                        placeholder="0.00"
                        inputMode="decimal"
                        className="h-12 rounded-xl bg-white/5 border-white/10"
                      />
                      {vaultShortfallUsdc6 > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 px-4"
                          onClick={() => setFundAmountInput((vaultShortfallUsdc6 / 1_000_000).toFixed(2))}
                          disabled={fundingBusy}
                        >
                          Use suggested
                        </Button>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Max: {formatUsdc(Math.round(treasuryBalanceUsdc6))} USDC
                    </div>
                  </div>

                  <Button
                    onClick={async () => {
                      try {
                        if (!canFundVault) {
                          if (!fundAmountUsdc6Bigint) toast.error("Enter an amount greater than 0");
                          return;
                        }
                        await approveAndDeposit(fundAmountUsdc6Bigint);
                        setFundAmountInput("");
                      } catch (e: any) {
                        toast.error("Funding failed", { description: e?.message ?? String(e) });
                      }
                    }}
                    disabled={!canFundVault || fundingBusy}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)]"
                  >
                    {fundingBusy
                      ? fundPhase === "preparing"
                        ? "Preparing…"
                        : fundPhase === "confirm_wallet"
                          ? needsApproval
                            ? "Confirm USDC approval…"
                            : "Confirm vault deposit…"
                          : "Confirming on network…"
                      : needsApproval
                        ? "Approve & Fund vault"
                        : "Fund vault"}
                  </Button>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Step order: approve ERC20 spending (if needed) → confirm vault deposit (depositERC20).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Obligations Card */}
          <div className="glass-card rounded-2xl p-6 flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Upcoming Obligations</h3>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                Next 30 Days
              </Badge>
            </div>
            <div className="space-y-4 flex-1">
              {(employerState.data?.payruns ?? []).slice(0, 2).map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <Badge className={cn(
                      "text-[10px]",
                      p.status === "draft" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {p.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold mb-1">Payrun {p.id.slice(0, 8)}</p>
                  <p className="text-lg font-extrabold">${formatUsdc(p.totalAmountUsdc6)}</p>
                  {p.txHash ? (
                    <a
                      className="mt-2 block text-[10px] font-mono text-muted-foreground hover:text-primary truncate"
                      href={`https://testnet.snowtrace.io/tx/${p.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {p.txHash}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full text-xs text-muted-foreground group">
              View All Obligations
              <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Employee Directory Table */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-xl font-bold">Employee Directory</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage salary streams and payroll status for all team members.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, role, or wallet..." 
                className="pl-10 pr-4 py-2 w-full sm:w-[350px] rounded-full border-white/10 bg-white/5 focus-visible:ring-primary/50"
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setEmployeePage(0);
                }}
              />
            </div>
          </div>
          
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold">Employee</TableHead>
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold">Role</TableHead>
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold">Wallet Address</TableHead>
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold">Salary (Monthly)</TableHead>
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold">Status</TableHead>
                  <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-bold text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No employees match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((employee) => (
                    <TableRow key={employee.id} className="border-white/5 hover:bg-white/5 transition-all">
                      <TableCell className="py-5 font-bold pl-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-[10px] text-white font-bold border border-white/10">
                            {employee.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          {employee.name}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-sm text-muted-foreground">{employee.title ?? "—"}</TableCell>
                      <TableCell className="py-5 font-mono text-[10px] text-muted-foreground">{employee.wallet}</TableCell>
                      <TableCell className="py-5 font-bold text-primary">${formatUsdc(employee.monthlySalaryUsdc6)}</TableCell>
                      <TableCell className="py-5">
                        <Badge
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px]",
                            employee.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {employee.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 text-right pr-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass border-white/10">
                            <DropdownMenuItem
                              className="focus:bg-white/5 cursor-pointer"
                              onClick={() => handleEditEmployee(employee)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10 cursor-pointer"
                              onClick={() => handleDeleteEmployee(employee)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete employee
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden p-4 space-y-3">
            {filteredEmployees.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                No employees match your search.
              </div>
            ) : (
              paginatedEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-[10px] text-white font-bold border border-white/10">
                        {employee.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-bold">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.title ?? "—"}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-white/10">
                          <DropdownMenuItem
                            className="focus:bg-white/5 cursor-pointer"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={() => handleDeleteEmployee(employee)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Wallet</p>
                      <p className="font-mono text-[10px] text-muted-foreground break-all">{employee.wallet}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Monthly Salary</p>
                      <p className="font-bold text-primary">${formatUsdc(employee.monthlySalaryUsdc6)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        employee.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {employee.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-white/10 bg-transparent h-8"
                onClick={() => setEmployeePage((p) => Math.max(0, p - 1))}
                disabled={employeePage <= 0 || filteredEmployees.length === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-white/10 bg-transparent h-8"
                onClick={() => setEmployeePage((p) => p + 1)}
                disabled={employeePageCount === 0 || employeePage + 1 >= employeePageCount}
              >
                Next
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredEmployees.length === 0
                ? "Showing 0 employee(s)"
                : `Showing ${employeePage * employeePageSize + 1}-${Math.min(filteredEmployees.length, (employeePage + 1) * employeePageSize)} of ${filteredEmployees.length} employee(s)`}
            </span>
          </div>
        </div>

        {/* Gas and Compliance Footer Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
          <div className="glass-card rounded-2xl p-6 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Real-time Gas Estimator</h4>
                <p className="text-xs text-muted-foreground">Current cost for batch payroll execution.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-accent">~$12.45</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">AvaFuji</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Compliance API Status</h4>
                <p className="text-xs text-muted-foreground">Institutional audit trail is active.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1">SECURED</Badge>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        </div>
      )}
    </Layout>
  );
}
