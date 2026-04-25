import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  FileText,
  Receipt,
  Wallet,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCents } from "@/components/finance/money";
import { InvoiceStatusBadge } from "@/components/finance/InvoiceStatusBadge";

export const Route = createFileRoute("/_dashboard/finance/")({
  component: FinanceOverviewPage,
});

function FinanceOverviewPage() {
  const { hasPermission } = useAuthContext();
  const canViewAll = hasPermission(PERMISSIONS.financeInvoicesViewAll);
  const canViewOwn = hasPermission(PERMISSIONS.financeInvoicesViewOwn);
  const canViewAccounts = hasPermission(PERMISSIONS.financeAccountsView);

  const accounts = useQuery(
    api.inventory.accounts.listAccounts,
    canViewAccounts ? { includeInactive: false, limit: 200 } : "skip",
  );
  const invoices = useQuery(
    api.inventory.invoices.listInvoices,
    canViewAll
      ? { scope: "all", limit: 200 }
      : canViewOwn
        ? { scope: "own", limit: 200 }
        : "skip",
  );

  if (!canViewOwn && !canViewAll && !canViewAccounts) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 text-sm text-muted-foreground">
          You don't have access to view finance data.
        </CardContent>
      </Card>
    );
  }

  const totalBalance =
    accounts?.reduce((acc, account) => acc + account.balanceCents, 0) ?? 0;
  const submitted =
    invoices?.filter((invoice) => invoice.status === "submitted") ?? [];
  const approved =
    invoices?.filter((invoice) => invoice.status === "approved") ?? [];
  const draftCount =
    invoices?.filter((invoice) => invoice.status === "draft").length ?? 0;
  const recent = invoices?.slice(0, 6) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {canViewAccounts && (
          <KpiCard
            icon={Wallet}
            label="Account balance"
            value={accounts === undefined ? null : formatCents(totalBalance)}
            subtext={
              accounts === undefined
                ? null
                : `${accounts.length} active accounts`
            }
          />
        )}
        <KpiCard
          icon={Clock3}
          label="Awaiting approval"
          value={invoices === undefined ? null : String(submitted.length)}
          subtext={
            invoices === undefined
              ? null
              : submitted.length === 0
                ? "Nothing to review"
                : `${formatCents(
                    submitted.reduce((acc, i) => acc + i.totalCents, 0),
                  )} pending`
          }
          tone={submitted.length > 0 ? "warning" : undefined}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Approved"
          value={invoices === undefined ? null : String(approved.length)}
          subtext={
            invoices === undefined
              ? null
              : `${formatCents(
                  approved.reduce((acc, i) => acc + i.totalCents, 0),
                )} total`
          }
        />
        <KpiCard
          icon={FileText}
          label="Drafts"
          value={invoices === undefined ? null : String(draftCount)}
          subtext="Not yet submitted"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="rounded-xl border-border/60">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4" /> Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 p-4 pt-0 sm:grid-cols-2">
            {(canViewOwn || canViewAll) && (
              <Button asChild variant="outline" className="justify-start">
                <Link to="/finance/invoices">
                  <Receipt className="mr-2 h-4 w-4" /> Browse invoices
                </Link>
              </Button>
            )}
            {canViewAccounts && (
              <Button asChild variant="outline" className="justify-start">
                <Link to="/finance/accounts">
                  <Wallet className="mr-2 h-4 w-4" /> Manage accounts
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <CardTitle className="text-base">Recent invoices</CardTitle>
            {(canViewOwn || canViewAll) && (
              <Button asChild size="sm" variant="ghost">
                <Link to="/finance/invoices">View all</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-1.5 p-4 pt-0">
            {invoices === undefined ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              recent.map((invoice) => (
                <Link
                  key={invoice._id}
                  to="/finance/invoices/$invoiceId"
                  params={{ invoiceId: String(invoice._id) }}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/60 px-2.5 py-2 text-sm transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {invoice.supplierName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {invoice.purchasedByName} •{" "}
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {formatCents(invoice.totalCents)}
                    </span>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string | null;
  subtext?: string | null;
  tone?: "warning";
}) {
  return (
    <Card className="rounded-xl border-border/60">
      <CardContent className="space-y-1 p-4">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wide">
            {label}
          </span>
          <Icon
            className={cn(
              "h-4 w-4",
              tone === "warning" ? "text-amber-500" : "text-muted-foreground",
            )}
          />
        </div>
        {value === null ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        )}
        {subtext === null ? (
          <Skeleton className="h-3 w-24" />
        ) : (
          subtext && (
            <p className="text-xs text-muted-foreground">{subtext}</p>
          )
        )}
      </CardContent>
    </Card>
  );
}
