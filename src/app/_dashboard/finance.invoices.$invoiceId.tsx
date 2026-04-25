import { useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  PackageCheck,
  Pencil,
  Plus,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCents } from "@/components/finance/money";
import {
  InvoiceStatusBadge,
  ReimbursementStatusBadge,
} from "@/components/finance/InvoiceStatusBadge";
import {
  InvoiceLineItemDialog,
  type LineItemFormValues,
} from "@/components/finance/InvoiceLineItemDialog";
import {
  AccountSplitDialog,
  type SplitFormValues,
} from "@/components/finance/AccountSplitDialog";
import { ReimbursementDialog } from "@/components/finance/ReimbursementDialog";
import { InvoiceMetaDialog } from "@/components/finance/InvoiceMetaDialog";
import { RejectInvoiceDialog } from "@/components/finance/RejectInvoiceDialog";

export const Route = createFileRoute(
  "/_dashboard/finance/invoices/$invoiceId",
)({
  component: FinanceInvoiceDetailPage,
});

function FinanceInvoiceDetailPage() {
  const { invoiceId } = useParams({
    from: "/_dashboard/finance/invoices/$invoiceId",
  });
  const navigate = useNavigate();
  const { hasPermission } = useAuthContext();

  const data = useQuery(api.inventory.invoices.getInvoice, {
    invoiceId: invoiceId as Id<"invoices">,
  });

  const submitInvoice = useMutation(api.inventory.invoices.submitInvoice);
  const approveInvoice = useMutation(api.inventory.invoices.approveInvoice);
  const voidInvoice = useMutation(api.inventory.invoices.voidInvoice);
  const deleteInvoice = useMutation(api.inventory.invoices.deleteInvoice);
  const removeLineItem = useMutation(api.inventory.invoices.removeLineItem);
  const removeAccountSplit = useMutation(
    api.inventory.invoices.removeAccountSplit,
  );
  const receiveInvoiceStock = useMutation(
    api.inventory.invoices.receiveInvoiceStock,
  );

  const [lineDialog, setLineDialog] = useState<{
    open: boolean;
    initial: LineItemFormValues | null;
  }>({ open: false, initial: null });
  const [splitDialog, setSplitDialog] = useState<{
    open: boolean;
    initial: SplitFormValues | null;
  }>({ open: false, initial: null });
  const [reimbursementOpen, setReimbursementOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canApprove = hasPermission(PERMISSIONS.financeInvoicesApprove);
  const canSplits = hasPermission(PERMISSIONS.financeSplitsManage);
  const canReimburse = hasPermission(PERMISSIONS.financeReimbursementsRecord);
  const canReceiveInvoice = hasPermission(
    PERMISSIONS.logisticsInvoiceReceived,
  );
  const canSubmitOwn = hasPermission(PERMISSIONS.financeInvoicesSubmitOwn);
  const canEditOwnDraft = hasPermission(
    PERMISSIONS.financeInvoicesEditOwnDraft,
  );

  if (data === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (data === null) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Invoice not found.
        </CardContent>
      </Card>
    );
  }

  const {
    invoice,
    lineItems,
    accountSplits,
    reimbursements,
    reimbursableCents,
    reimbursedCents,
    splitTotalCents,
  } = data;

  const isDraft = invoice.status === "draft";
  const isSubmitted = invoice.status === "submitted";
  const isApproved = invoice.status === "approved";
  const editable = isDraft && canEditOwnDraft;
  const canEditSplits =
    canSplits && invoice.status !== "void" && invoice.status !== "rejected";
  const splitRemainingCents = invoice.totalCents - splitTotalCents;
  const reimbursableRemaining = reimbursableCents - reimbursedCents;

  const handleAction = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-muted-foreground"
        >
          <Link to="/finance/invoices">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> All invoices
          </Link>
        </Button>
      </div>

      <Card className="rounded-xl border-border/60">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {invoice.supplierName}
                </h2>
                <InvoiceStatusBadge status={invoice.status} />
                <ReimbursementStatusBadge
                  status={invoice.reimbursementStatus}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Purchased by {invoice.purchasedByName} on{" "}
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </p>
              {invoice.notes && (
                <p className="text-sm text-muted-foreground">
                  {invoice.notes}
                </p>
              )}
              {invoice.rejectionReason && (
                <p className="text-sm text-destructive">
                  Rejection reason: {invoice.rejectionReason}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {editable && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMetaOpen(true)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {isDraft && canSubmitOwn && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleAction(() =>
                      submitInvoice({ invoiceId: invoice._id }),
                    )
                  }
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Submit
                </Button>
              )}
              {isSubmitted && canApprove && (
                <>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleAction(() =>
                        approveInvoice({ invoiceId: invoice._id }),
                      )
                    }
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectOpen(true)}
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                  </Button>
                </>
              )}
              {isApproved && canReceiveInvoice && !invoice.inventoryReceivedAt && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleAction(() =>
                      receiveInvoiceStock({ invoiceId: invoice._id }),
                    )
                  }
                >
                  <PackageCheck className="mr-1.5 h-3.5 w-3.5" />
                  Receive into stock
                </Button>
              )}
              {canApprove &&
                (isSubmitted || isApproved) &&
                !invoice.inventoryReceivedAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleAction(() =>
                        voidInvoice({ invoiceId: invoice._id }),
                      )
                    }
                  >
                    <Ban className="mr-1.5 h-3.5 w-3.5" /> Void
                  </Button>
                )}
              {editable && reimbursements.length === 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={async () => {
                    if (!confirm("Delete this invoice?")) return;
                    await handleAction(async () => {
                      await deleteInvoice({ invoiceId: invoice._id });
                      navigate({ to: "/finance/invoices" });
                    });
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>
          <TotalsSummary
            subtotalCents={invoice.subtotalCents}
            taxCents={invoice.taxCents}
            shippingCents={invoice.shippingCents}
            discountCents={invoice.discountCents}
            totalCents={invoice.totalCents}
          />
          {invoice.inventoryReceivedAt && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Stock received on{" "}
              {new Date(invoice.inventoryReceivedAt).toLocaleDateString()}
            </p>
          )}
          {actionError && (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/60">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-base">Line items</CardTitle>
          {editable && (
            <Button
              size="sm"
              onClick={() => setLineDialog({ open: true, initial: null })}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add line item
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Line total</TableHead>
                {editable && <TableHead className="w-[1%]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={editable ? 5 : 4}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No line items yet.
                  </TableCell>
                </TableRow>
              ) : (
                lineItems.map((line) => (
                  <TableRow key={line._id}>
                    <TableCell>
                      <div className="font-medium">
                        {line.itemNameSnapshot}
                      </div>
                      {(line.itemSkuSnapshot ||
                        line.itemPartNumberSnapshot ||
                        line.description) && (
                        <div className="text-xs text-muted-foreground">
                          {[
                            line.itemSkuSnapshot,
                            line.itemPartNumberSnapshot,
                            line.description,
                          ]
                            .filter(Boolean)
                            .join(" - ")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.quantity} {line.unit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCents(line.unitCostCents)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCents(line.lineTotalCents)}
                    </TableCell>
                    {editable && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() =>
                              setLineDialog({
                                open: true,
                                initial: {
                                  _id: line._id,
                                  itemId: line.itemId,
                                  itemName: line.itemNameSnapshot,
                                  itemSku: line.itemSkuSnapshot,
                                  itemPartNumber: line.itemPartNumberSnapshot,
                                  description: line.description,
                                  quantity: line.quantity,
                                  unit: line.unit,
                                  unitCostCents: line.unitCostCents,
                                },
                              })
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={async () => {
                              if (!confirm("Remove this line item?")) return;
                              await handleAction(() =>
                                removeLineItem({
                                  invoiceId: invoice._id,
                                  lineItemId: line._id,
                                }),
                              );
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border-border/60">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div>
              <CardTitle className="text-base">Account splits</CardTitle>
              <p className="text-xs text-muted-foreground">
                Splits cover {formatCents(splitTotalCents)} of{" "}
                {formatCents(invoice.totalCents)}
                {splitRemainingCents !== 0 && (
                  <>
                    {" "}
                    •{" "}
                    <span
                      className={cn(
                        splitRemainingCents > 0
                          ? "text-amber-600"
                          : "text-destructive",
                      )}
                    >
                      {splitRemainingCents > 0
                        ? `${formatCents(splitRemainingCents)} remaining`
                        : `${formatCents(-splitRemainingCents)} over`}
                    </span>
                  </>
                )}
              </p>
            </div>
            {canEditSplits && (
              <Button
                size="sm"
                onClick={() =>
                  setSplitDialog({ open: true, initial: null })
                }
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Split
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-1.5 p-4 pt-0">
            {accountSplits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No splits recorded yet.
              </p>
            ) : (
              accountSplits.map((split) => (
                <div
                  key={split._id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/60 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{split.accountName}</p>
                    {split.notes && (
                      <p className="truncate text-xs text-muted-foreground">
                        {split.notes}
                      </p>
                    )}
                  </div>
                  <span className="font-medium tabular-nums">
                    {formatCents(split.amountCents)}
                  </span>
                  {canEditSplits && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() =>
                          setSplitDialog({
                            open: true,
                            initial: {
                              _id: split._id,
                              accountId: split.accountId,
                              amountCents: split.amountCents,
                              notes: split.notes,
                            },
                          })
                        }
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      {invoice.status !== "approved" && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={async () => {
                            if (!confirm("Remove this split?")) return;
                            await handleAction(() =>
                              removeAccountSplit({
                                invoiceId: invoice._id,
                                splitId: split._id,
                              }),
                            );
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div>
              <CardTitle className="text-base">Reimbursements</CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatCents(reimbursedCents)} of {formatCents(reimbursableCents)} reimbursed
              </p>
            </div>
            {canReimburse && isApproved && reimbursableRemaining > 0 && (
              <Button size="sm" onClick={() => setReimbursementOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Record
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-1.5 p-4 pt-0">
            {reimbursements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reimbursements recorded.
              </p>
            ) : (
              reimbursements.map((reimb) => (
                <div
                  key={reimb._id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/60 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {new Date(reimb.reimbursedAt).toLocaleDateString()}
                    </p>
                    {reimb.notes && (
                      <p className="truncate text-xs text-muted-foreground">
                        {reimb.notes}
                      </p>
                    )}
                  </div>
                  <span className="font-medium tabular-nums">
                    {formatCents(reimb.amountCents)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {editable && (
        <InvoiceLineItemDialog
          open={lineDialog.open}
          onOpenChange={(open) =>
            setLineDialog((prev) => ({ ...prev, open }))
          }
          invoiceId={invoice._id}
          supplierId={invoice.supplierId}
          initial={lineDialog.initial}
        />
      )}
      {canEditSplits && (
        <AccountSplitDialog
          open={splitDialog.open}
          onOpenChange={(open) =>
            setSplitDialog((prev) => ({ ...prev, open }))
          }
          invoiceId={invoice._id}
          remainingCents={splitRemainingCents}
          initial={splitDialog.initial}
        />
      )}
      {canReimburse && (
        <ReimbursementDialog
          open={reimbursementOpen}
          onOpenChange={setReimbursementOpen}
          invoiceId={invoice._id}
          defaultRecipientUserId={invoice.purchasedByUserId}
          remainingCents={reimbursableRemaining}
        />
      )}
      {editable && (
        <InvoiceMetaDialog
          open={metaOpen}
          onOpenChange={setMetaOpen}
          invoiceId={invoice._id}
          hasLineItems={lineItems.length > 0}
          initial={{
            supplierId: invoice.supplierId,
            purchasedByUserId: invoice.purchasedByUserId,
            invoiceDate: invoice.invoiceDate,
            taxCents: invoice.taxCents,
            shippingCents: invoice.shippingCents,
            discountCents: invoice.discountCents,
            notes: invoice.notes,
          }}
        />
      )}
      {canApprove && (
        <RejectInvoiceDialog
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          invoiceId={invoice._id}
        />
      )}
    </div>
  );
}

function TotalsSummary({
  subtotalCents,
  taxCents,
  shippingCents,
  discountCents,
  totalCents,
}: {
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm sm:grid-cols-5">
      <Cell label="Subtotal" value={formatCents(subtotalCents)} />
      <Cell label="Tax" value={formatCents(taxCents)} />
      <Cell label="Shipping" value={formatCents(shippingCents)} />
      <Cell label="Discount" value={formatCents(discountCents)} />
      <Cell label="Total" value={formatCents(totalCents)} highlight />
    </div>
  );
}

function Cell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "tabular-nums",
          highlight ? "text-base font-semibold" : "text-sm",
        )}
      >
        {value}
      </p>
    </div>
  );
}
