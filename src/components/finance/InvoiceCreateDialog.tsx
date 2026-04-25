import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function todayIsoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function InvoiceCreateDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { hasPermission } = useAuthContext();
  const canAssignPurchaser = hasPermission(
    PERMISSIONS.financeInvoicesAssignPurchaser,
  );

  const createInvoice = useMutation(api.inventory.invoices.createInvoice);
  const suppliers = useQuery(
    api.inventory.catalog.listSuppliers,
    open ? { includeInactive: false, limit: 200 } : "skip",
  );
  const usersResp = useQuery(
    api.auth.users.listUsersForAssignment,
    open && canAssignPurchaser
      ? { paginationOpts: { numItems: 100, cursor: null } }
      : "skip",
  );
  const users = usersResp?.page ?? [];

  const [supplierId, setSupplierId] = useState("");
  const [purchasedByUserId, setPurchasedByUserId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSupplierId("");
      setPurchasedByUserId("");
      setInvoiceDate(todayIsoDate());
      setNotes("");
      setError(null);
    }
  }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supplierId) return;
    setSubmitting(true);
    setError(null);
    try {
      const invoiceDateMs = invoiceDate
        ? new Date(invoiceDate).getTime()
        : undefined;
      if (invoiceDate && Number.isNaN(invoiceDateMs)) {
        throw new Error("Invoice date is invalid.");
      }
      const invoiceId = await createInvoice({
        supplierId: supplierId as Id<"inventorySuppliers">,
        purchasedByUserId: purchasedByUserId
          ? (purchasedByUserId as Id<"users">)
          : undefined,
        invoiceDate: invoiceDateMs,
        notes: notes || undefined,
      });
      onOpenChange(false);
      navigate({
        to: "/finance/invoices/$invoiceId",
        params: { invoiceId: String(invoiceId) },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>
            Start a draft. You can add line items, splits, and submit for
            approval afterward.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invoice-supplier">Supplier</FieldLabel>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="invoice-supplier" className="w-full">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {(suppliers ?? []).map((supplier) => (
                    <SelectItem
                      key={supplier._id}
                      value={String(supplier._id)}
                    >
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              {canAssignPurchaser && (
                <Field>
                  <FieldLabel htmlFor="invoice-purchaser">
                    Purchaser
                  </FieldLabel>
                  <Select
                    value={purchasedByUserId || "__self"}
                    onValueChange={(value) =>
                      setPurchasedByUserId(value === "__self" ? "" : value)
                    }
                  >
                    <SelectTrigger id="invoice-purchaser" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__self">Me</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user._id} value={String(user._id)}>
                          {[user.firstName, user.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                            user.email ||
                            "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="invoice-date">Invoice date</FieldLabel>
                <Input
                  id="invoice-date"
                  type="date"
                  value={invoiceDate}
                  onChange={(event) => setInvoiceDate(event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="invoice-notes">Notes</FieldLabel>
              <Textarea
                id="invoice-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
              />
            </Field>
          </FieldGroup>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !supplierId}>
              {submitting ? "Creating…" : "Create draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
