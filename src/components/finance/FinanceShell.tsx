import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Receipt, Wallet } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type NavId = "overview" | "invoices" | "accounts";

type NavItem = {
  id: NavId;
  label: string;
  to: "/finance" | "/finance/invoices" | "/finance/accounts";
  icon: typeof Receipt;
  permission?: keyof typeof PERMISSIONS;
};

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", to: "/finance", icon: LayoutDashboard },
  {
    id: "invoices",
    label: "Invoices",
    to: "/finance/invoices",
    icon: Receipt,
    permission: "financeInvoicesViewOwn",
  },
  {
    id: "accounts",
    label: "Accounts",
    to: "/finance/accounts",
    icon: Wallet,
    permission: "financeAccountsView",
  },
];

function pathnameToActiveNav(pathname: string): NavId {
  if (pathname.startsWith("/finance/invoices")) return "invoices";
  if (pathname.startsWith("/finance/accounts")) return "accounts";
  return "overview";
}

export function FinanceShell({ children }: { children: ReactNode }) {
  const { hasPermission } = useAuthContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathnameToActiveNav(pathname);

  const visible = NAV.filter(
    (item) => !item.permission || hasPermission(PERMISSIONS[item.permission]),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Finance</h1>
        <p className="text-sm text-muted-foreground">
          Track invoices, account splits, reimbursements, and account balances.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto border-b border-border/60 pb-1">
        {visible.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className={cn(
              "inline-flex items-center gap-2 rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active === item.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="space-y-4">{children}</div>
    </div>
  );
}
