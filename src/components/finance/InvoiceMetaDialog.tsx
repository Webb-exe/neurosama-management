import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import {
  centsToDollarsInput,
  parseDollarsToCents,
} from "@/components/finance/money";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: Id<"invoices">;
  hasLineItems: boolean;
  initial: {
    supplierId: Id<"inventorySuppliers">;
    purchasedByUserId: Id<"users">;
    invoiceDate: number;
    taxCents: number;
    shippingCents: number;
    discountCents: number;
    notes: string;
  };
};

function dateToIso(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function InvoiceMetaDialog({
  open,
  onOpenChange,
  invoiceId,
  hasLineItems,
  initial,
}: Props) {
  const { hasPermission } = useAuthContext();
  const canAssignPurchaser = hasPermission(
    PERMISSIONS.financeInvoicesAssignPurchaser,
  );
  const updateInvoiceDraft = useMutation(
    api.inventory.invoices.updateInvoiceDraft,
  );
  const suppliers = useQuery(
    api.inventory.catalog.listSuppliers,
    open ? { includeInactive: true, limit: 200 } : "skip",
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
  const [invoiceDate, setInvoiceDate] = useState(dateToIso(Date.now()));
  const [tax, setTax] = useState("");
  const [shipping, setShipping] = useState("");
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSupplierId(String(initial.supplierId));
      setPurchasedByUserId(String(initial.purchasedByUserId));
      setInvoiceDate(dateToIso(initial.invoiceDate));
      setTax(centsToDollarsInput(initial.taxCents));
      setShipping(centsToDollarsInput(initial.shippingCents));
      setDiscount(centsToDollarsInput(initial.discountCents));
      setNotes(initial.notes);
      setError(null);
    }
  }, [open, initial]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const dateMs = invoiceDate ? new Date(invoiceDate).getTime() : undefined;
      if (invoiceDate && Number.isNaN(dateMs)) {
        throw new Error("Invoice date is invalid.");
      }
      const parseCharge = (value: string, name: string) => {
        if (!value.trim()) return 0;
        const cents = parseDollarsToCents(value);
        if (cents === null || cents < 0) {
          throw new Error(`${name} must be a non-negative dollar amount.`);
        }
        return cents;
      };
      const taxCents = parseCharge(tax, "Tax");
      const shippingCents = parseCharge(shipping, "Shipping");
      const discountCents = parseCharge(discount, "Discount");
      await updateInvoiceDraft({
        invoiceId,
        supplierId: supplierId as Id<"inventorySuppliers">,
        purchasedByUserId: purchasedByUserId as Id<"users">,
        invoiceDate: dateMs,
        taxCents,
        shippingCents,
        discountCents,
        notes,
      });
      onOpenChange(false);
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
          <DialogTitle>Edit invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="meta-supplier">Supplier</FieldLabel>
              <Select
                value={supplierId}
                onValueChange={setSupplierId}
                disabled={hasLineItems}
              >
                <SelectTrigger id="meta-supplier" className="w-full">
                  <SelectValue />
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
              {hasLineItems && (
                <p className="text-xs text-muted-foreground">
                  Cannot change supplier after line items have been added.
                </p>
              )}
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              {canAssignPurchaser && (
                <Field>
                  <FieldLabel htmlFor="meta-purchaser">Purchaser</FieldLabel>
                  <Select
                    value={purchasedByUserId}
                    onValueChange={setPurchasedByUserId}
                  >
                    <SelectTrigger id="meta-purchaser" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                <FieldLabel htmlFor="meta-date">Invoice date</FieldLabel>
                <Input
                  id="meta-date"
                  type="date"
                  value={invoiceDate}
                  onChange={(event) => setInvoiceDate(event.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="meta-tax">Tax ($)</FieldLabel>
                <Input
                  id="meta-tax"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={tax}
                  onChange={(event) => setTax(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="meta-shipping">Shipping ($)</FieldLabel>
                <Input
                  id="meta-shipping"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={shipping}
                  onChange={(event) => setShipping(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="meta-discount">Discount ($)</FieldLabel>
                <Input
                  id="meta-discount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="meta-notes">Notes</FieldLabel>
              <Textarea
                id="meta-notes"
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
