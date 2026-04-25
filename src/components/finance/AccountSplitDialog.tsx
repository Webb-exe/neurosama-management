import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import {
  centsToDollarsInput,
  formatCents,
  parseDollarsToCents,
} from "@/components/finance/money";

export type SplitFormValues = {
  _id: Id<"invoiceAccountSplits">;
  accountId: Id<"financeAccounts">;
  amountCents: number;
  notes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: Id<"invoices">;
  remainingCents: number;
  initial?: SplitFormValues | null;
};

export function AccountSplitDialog({
  open,
  onOpenChange,
  invoiceId,
  remainingCents,
  initial,
}: Props) {
  const upsertAccountSplit = useMutation(
    api.inventory.invoices.upsertAccountSplit,
  );
  const accounts = useQuery(
    api.inventory.accounts.listAccounts,
    open ? { includeInactive: false, limit: 200 } : "skip",
  );

  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAccountId(initial ? String(initial.accountId) : "");
      setAmount(
        initial
          ? centsToDollarsInput(initial.amountCents)
          : centsToDollarsInput(remainingCents > 0 ? remainingCents : 0),
      );
      setNotes(initial?.notes ?? "");
      setError(null);
    }
  }, [open, initial, remainingCents]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountId) return;
    setSubmitting(true);
    setError(null);
    try {
      const cents = parseDollarsToCents(amount);
      if (cents === null || cents <= 0) {
        throw new Error("Split amount must be a positive dollar amount.");
      }
      await upsertAccountSplit({
        invoiceId,
        ...(initial ? { splitId: initial._id } : {}),
        accountId: accountId as Id<"financeAccounts">,
        amountCents: cents,
        notes: notes || undefined,
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
          <DialogTitle>{initial ? "Edit split" : "Add account split"}</DialogTitle>
          <DialogDescription>
            Splits can be adjusted after approval. Current remaining{" "}
            {formatCents(remainingCents)}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="split-account">Account</FieldLabel>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="split-account" className="w-full">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {(accounts ?? []).map((account) => (
                    <SelectItem
                      key={account._id}
                      value={String(account._id)}
                    >
                      {account.name} ({formatCents(account.balanceCents)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="split-amount">Amount ($)</FieldLabel>
              <Input
                id="split-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="split-notes">Notes</FieldLabel>
              <Textarea
                id="split-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
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
            <Button type="submit" disabled={submitting || !accountId}>
              {submitting ? "Saving…" : initial ? "Save" : "Add split"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
