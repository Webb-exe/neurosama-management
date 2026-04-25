import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
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

export type ShelfFormValues = {
  _id: Id<"storageShelves">;
  name: string;
  description: string;
  physicalLocationLabel: string;
  sortOrder: number;
  active: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ShelfFormValues | null;
};

export function ShelfFormDialog({ open, onOpenChange, initial }: Props) {
  const createShelf = useMutation(api.inventory.locations.createShelf);
  const updateShelf = useMutation(api.inventory.locations.updateShelf);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setLocation(initial?.physicalLocationLabel ?? "");
      setSortOrder(initial ? String(initial.sortOrder) : "");
      setActive(initial?.active ?? true);
      setError(null);
    }
  }, [open, initial]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !location.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const sortOrderNumber = sortOrder.trim() ? Number(sortOrder) : undefined;
      if (sortOrderNumber !== undefined && Number.isNaN(sortOrderNumber)) {
        throw new Error("Sort order must be a number.");
      }
      if (initial) {
        await updateShelf({
          shelfId: initial._id,
          name,
          description,
          physicalLocationLabel: location,
          sortOrder: sortOrderNumber,
          active,
        });
      } else {
        await createShelf({
          name,
          description,
          physicalLocationLabel: location,
          sortOrder: sortOrderNumber,
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
          <DialogTitle>{initial ? "Edit shelf" : "New shelf"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="shelf-name">Name</FieldLabel>
              <Input
                id="shelf-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="shelf-location">Physical location</FieldLabel>
              <Input
                id="shelf-location"
                placeholder="e.g. Lab — north wall"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="shelf-description">Description</FieldLabel>
              <Textarea
                id="shelf-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="shelf-sort">Sort order</FieldLabel>
              <Input
                id="shelf-sort"
                type="number"
                step="1"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                placeholder="Lower numbers show first"
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
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !location.trim()}
            >
              {submitting ? "Saving…" : initial ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
