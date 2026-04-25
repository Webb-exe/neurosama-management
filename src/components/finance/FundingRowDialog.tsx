import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
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
import { parseDollarsToCents } from "@/components/finance/money";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: Id<"financeAccounts">;
  accountName: string;
};

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function FundingRowDialog({
  open,
  onOpenChange,
  accountId,
  accountName,
}: Props) {
  const addFundingRow = useMutation(api.inventory.accounts.addFundingRow);

  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSource("");
      setAmount("");
      setDate(todayIsoDate());
      setNotes("");
      setError(null);
    }
  }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!source.trim() || !amount.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const cents = parseDollarsToCents(amount);
      if (cents === null || cents <= 0) {
        throw new Error("Amount must be a positive dollar value.");
      }
      const fundedAt = date ? new Date(date).getTime() : undefined;
      if (date && Number.isNaN(fundedAt)) {
        throw new Error("Funding date is invalid.");
      }
      await addFundingRow({
        accountId,
        source,
        amountCents: cents,
        fundedAt,
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
          <DialogTitle>Add funding</DialogTitle>
          <DialogDescription>
            Log a deposit, grant award, or balance adjustment for {accountName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="funding-source">Source</FieldLabel>
              <Input
                id="funding-source"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="e.g. School deposit, Sponsor"
                required
                autoFocus
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="funding-amount">Amount ($)</FieldLabel>
                <Input
                  id="funding-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="funding-date">Funded on</FieldLabel>
                <Input
                  id="funding-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="funding-notes">Notes</FieldLabel>
              <Textarea
                id="funding-notes"
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
            <Button
              type="submit"
              disabled={submitting || !source.trim() || !amount.trim()}
            >
              {submitting ? "Saving…" : "Add funding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
