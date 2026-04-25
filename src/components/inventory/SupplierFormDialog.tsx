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

export type SupplierFormValues = {
  _id: Id<"inventorySuppliers">;
  name: string;
  description: string;
  contactName?: string;
  contactEmail?: string;
  websiteUrl?: string;
  active: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: SupplierFormValues | null;
};

export function SupplierFormDialog({ open, onOpenChange, initial }: Props) {
  const createSupplier = useMutation(api.inventory.catalog.createSupplier);
  const updateSupplier = useMutation(api.inventory.catalog.updateSupplier);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setContactName(initial?.contactName ?? "");
      setContactEmail(initial?.contactEmail ?? "");
      setWebsiteUrl(initial?.websiteUrl ?? "");
      setActive(initial?.active ?? true);
      setError(null);
    }
  }, [open, initial]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (initial) {
        await updateSupplier({
          supplierId: initial._id,
          name,
          description,
          contactName: contactName || undefined,
          contactEmail: contactEmail || undefined,
          websiteUrl: websiteUrl || undefined,
          active,
        });
      } else {
        await createSupplier({
          name,
          description,
          contactName: contactName || undefined,
          contactEmail: contactEmail || undefined,
          websiteUrl: websiteUrl || undefined,
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
          <DialogTitle>{initial ? "Edit supplier" : "New supplier"}</DialogTitle>
          <DialogDescription>
            Suppliers group inventory items so we can track who we buy from.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="supplier-name">Name</FieldLabel>
              <Input
                id="supplier-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-description">Description</FieldLabel>
              <Textarea
                id="supplier-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="supplier-contact-name">Contact</FieldLabel>
                <Input
                  id="supplier-contact-name"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="supplier-contact-email">Email</FieldLabel>
                <Input
                  id="supplier-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="supplier-website">Website</FieldLabel>
              <Input
                id="supplier-website"
                type="url"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
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
