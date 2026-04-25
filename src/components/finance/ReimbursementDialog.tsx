import { useEffect, useMemo, useState } from "react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: Id<"invoices">;
  defaultRecipientUserId?: Id<"users">;
  remainingCents: number;
};

function todayIsoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ReimbursementDialog({
  open,
  onOpenChange,
  invoiceId,
  defaultRecipientUserId,
  remainingCents,
}: Props) {
  const recordReimbursement = useMutation(
    api.inventory.invoices.recordReimbursement,
  );

  const accounts = useQuery(
    api.inventory.accounts.listAccounts,
    open ? { includeInactive: false, limit: 200 } : "skip",
  );
  const usersResp = useQuery(
    api.auth.users.listUsersForAssignment,
    open ? { paginationOpts: { numItems: 100, cursor: null } } : "skip",
  );
  const users = usersResp?.page ?? [];

  const [reimbursedToUserId, setReimbursedToUserId] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [reimbursedToAccountId, setReimbursedToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReimbursedToUserId(
        defaultRecipientUserId ? String(defaultRecipientUserId) : "",
      );
      setSourceAccountId("");
      setReimbursedToAccountId("");
      setAmount(centsToDollarsInput(remainingCents > 0 ? remainingCents : 0));
      setDate(todayIsoDate());
      setNotes("");
      setError(null);
    }
  }, [open, defaultRecipientUserId, remainingCents]);

  const memberAccounts = useMemo(() => {
    if (!accounts) return [];
    if (!reimbursedToUserId) return [];
    return accounts.filter(
      (account) =>
        !account.linkedUserId ||
        String(account.linkedUserId) === reimbursedToUserId,
    );
  }, [accounts, reimbursedToUserId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reimbursedToUserId || !sourceAccountId) return;
    setSubmitting(true);
    setError(null);
    try {
      const cents = parseDollarsToCents(amount);
      if (cents === null || cents <= 0) {
        throw new Error("Amount must be a positive dollar amount.");
      }
      const reimbursedAt = date ? new Date(date).getTime() : undefined;
      if (date && Number.isNaN(reimbursedAt)) {
        throw new Error("Date is invalid.");
      }
      await recordReimbursement({
        invoiceId,
        reimbursedToUserId: reimbursedToUserId as Id<"users">,
        sourceAccountId: sourceAccountId as Id<"financeAccounts">,
        reimbursedToAccountId: reimbursedToAccountId
          ? (reimbursedToAccountId as Id<"financeAccounts">)
          : undefined,
        amountCents: cents,
        reimbursedAt,
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
          <DialogTitle>Record reimbursement</DialogTitle>
          <DialogDescription>
            Remaining reimbursable amount: {formatCents(remainingCents)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reimb-user">Recipient user</FieldLabel>
              <Select
                value={reimbursedToUserId}
                onValueChange={setReimbursedToUserId}
              >
                <SelectTrigger id="reimb-user" className="w-full">
                  <SelectValue placeholder="Select user" />
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="reimb-source">Source account</FieldLabel>
                <Select
                  value={sourceAccountId}
                  onValueChange={setSourceAccountId}
                >
                  <SelectTrigger id="reimb-source" className="w-full">
                    <SelectValue placeholder="Select source" />
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
                <FieldLabel htmlFor="reimb-target">Recipient account</FieldLabel>
                <Select
                  value={reimbursedToAccountId || "__none"}
                  onValueChange={(value) =>
                    setReimbursedToAccountId(value === "__none" ? "" : value)
                  }
                >
                  <SelectTrigger id="reimb-target" className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None (cash to user)</SelectItem>
                    {memberAccounts.map((account) => (
                      <SelectItem
                        key={account._id}
                        value={String(account._id)}
                      >
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="reimb-amount">Amount ($)</FieldLabel>
                <Input
                  id="reimb-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reimb-date">Reimbursed on</FieldLabel>
                <Input
                  id="reimb-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="reimb-notes">Notes</FieldLabel>
              <Textarea
                id="reimb-notes"
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
              disabled={submitting || !reimbursedToUserId || !sourceAccountId}
            >
              {submitting ? "Saving…" : "Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
