import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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

const ACCOUNT_TYPES = [
  { value: "team", label: "Team" },
  { value: "grant", label: "Grant" },
  { value: "member", label: "Member" },
  { value: "sponsor", label: "Sponsor" },
  { value: "other", label: "Other" },
] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

export type AccountFormValues = {
  _id: Id<"financeAccounts">;
  name: string;
  type: AccountType;
  linkedUserId?: Id<"users">;
  description: string;
  active: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AccountFormValues | null;
};

export function AccountFormDialog({ open, onOpenChange, initial }: Props) {
  const createAccount = useMutation(api.inventory.accounts.createAccount);
  const updateAccount = useMutation(api.inventory.accounts.updateAccount);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("team");
  const [description, setDescription] = useState("");
  const [linkedUserId, setLinkedUserId] = useState<string>("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usersResp = useQuery(
    api.auth.users.listUsersForAssignment,
    open ? { paginationOpts: { numItems: 100, cursor: null } } : "skip",
  );
  const users = usersResp?.page ?? [];

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? "team");
      setDescription(initial?.description ?? "");
      setLinkedUserId(initial?.linkedUserId ? String(initial.linkedUserId) : "");
      setActive(initial?.active ?? true);
      setError(null);
    }
  }, [open, initial]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (initial) {
        const wantsClear = !linkedUserId && initial.linkedUserId !== undefined;
        await updateAccount({
          accountId: initial._id,
          name,
          type,
          description,
          linkedUserId: linkedUserId
            ? (linkedUserId as Id<"users">)
            : undefined,
          clearLinkedUser: wantsClear ? true : undefined,
          active,
        });
      } else {
        await createAccount({
          name,
          type,
          description,
          linkedUserId: linkedUserId
            ? (linkedUserId as Id<"users">)
            : undefined,
          active,
        });
      }
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
          <DialogTitle>
            {initial ? "Edit account" : "New finance account"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="account-name">Name</FieldLabel>
              <Input
                id="account-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="account-type">Type</FieldLabel>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as AccountType)}
                >
                  <SelectTrigger id="account-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="account-user">Linked user</FieldLabel>
                <Select
                  value={linkedUserId || "__none"}
                  onValueChange={(value) =>
                    setLinkedUserId(value === "__none" ? "" : value)
                  }
                >
                  <SelectTrigger id="account-user" className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
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
            </div>
            <Field>
              <FieldLabel htmlFor="account-description">Description</FieldLabel>
              <Textarea
                id="account-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="h-4 w-4"
              />
              Active
            </label>
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
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Saving…" : initial ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
