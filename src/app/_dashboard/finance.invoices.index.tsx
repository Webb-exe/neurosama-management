import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Plus, Search, Upload } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCents } from "@/components/finance/money";
import {
  InvoiceStatusBadge,
  ReimbursementStatusBadge,
  type InvoiceStatus,
} from "@/components/finance/InvoiceStatusBadge";
import { InvoiceCreateDialog } from "@/components/finance/InvoiceCreateDialog";
import { InvoiceUploadDialog } from "@/components/finance/InvoiceUploadDialog";

export const Route = createFileRoute("/_dashboard/finance/invoices/")({
  component: FinanceInvoicesListPage,
});

const STATUS_OPTIONS: { value: "all" | InvoiceStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "void", label: "Void" },
];

function FinanceInvoicesListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuthContext();
  const canViewOwn = hasPermission(PERMISSIONS.financeInvoicesViewOwn);
  const canViewAll = hasPermission(PERMISSIONS.financeInvoicesViewAll);
  const canCreate = hasPermission(PERMISSIONS.financeInvoicesCreateOwn);

  const [scope, setScope] = useState<"own" | "all">(
    canViewAll ? "all" : "own",
  );
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>(
    "all",
  );
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const effectiveScope: "own" | "all" = canViewAll ? scope : "own";

  const invoices = useQuery(
    api.inventory.invoices.listInvoices,
    canViewOwn || canViewAll ? { scope: effectiveScope, limit: 200 } : "skip",
  );

  const filtered = useMemo(() => {
    if (!invoices) return [];
    const needle = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (statusFilter !== "all" && invoice.status !== statusFilter)
        return false;
      if (!needle) return true;
      return (
        invoice.supplierName.toLowerCase().includes(needle) ||
        invoice.purchasedByName.toLowerCase().includes(needle) ||
        invoice.notes.toLowerCase().includes(needle)
      );
    });
  }, [invoices, statusFilter, search]);

  if (!canViewOwn && !canViewAll) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 text-sm text-muted-foreground">
          You don't have permission to view invoices.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="rounded-xl border-border/60">
        <CardContent className="space-y-3 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search supplier, purchaser, notes"
                className="h-9 pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | InvoiceStatus)
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canViewAll && (
              <Select
                value={scope}
                onValueChange={(value) => setScope(value as "own" | "all")}
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All invoices</SelectItem>
                  <SelectItem value="own">My invoices</SelectItem>
                </SelectContent>
              </Select>
            )}
            {canCreate && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUploadOpen(true)}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload invoice
                </Button>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> New invoice
                </Button>
              </>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier / Purchaser</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reimb.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices === undefined ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Skeleton className="mx-auto h-5 w-32" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground"
                    >
                      No invoices match the current filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((invoice) => (
                    <TableRow
                      key={invoice._id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: "/finance/invoices/$invoiceId",
                          params: { invoiceId: String(invoice._id) },
                        })
                      }
                    >
                      <TableCell>
                        <div className="font-medium">
                          {invoice.supplierName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.purchasedByName}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                        <ReimbursementStatusBadge
                          status={invoice.reimbursementStatus}
                        />
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          invoice.status === "void" &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {formatCents(invoice.totalCents)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InvoiceCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <InvoiceUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
