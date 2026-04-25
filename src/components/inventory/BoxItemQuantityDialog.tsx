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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boxId: Id<"storageBoxes">;
  boxLabel: string;
  initial?: {
    itemId: Id<"inventoryItems">;
    itemName: string;
    quantity: number;
    unit: string;
    notes: string;
  } | null;
};

export function BoxItemQuantityDialog({
  open,
  onOpenChange,
  boxId,
  boxLabel,
  initial,
}: Props) {
  const setBoxItemQuantity = useMutation(
    api.inventory.locations.setBoxItemQuantity,
  );
  const items = useQuery(
    api.inventory.catalog.listItems,
    open && !initial ? { includeInactive: false, limit: 200 } : "skip",
  );

  const [itemId, setItemId] = useState<string>("");
  const [quantity, setQuantity] = useState("0");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setItemId(initial ? String(initial.itemId) : "");
      setQuantity(initial ? String(initial.quantity) : "1");
      setUnit(initial?.unit ?? "");
      setNotes(initial?.notes ?? "");
      setError(null);
    }
  }, [open, initial]);

  const selectedItem = useMemo(
    () => items?.find((item) => String(item._id) === itemId),
    [items, itemId],
  );

  useEffect(() => {
    if (!initial && selectedItem && !unit) {
      setUnit(selectedItem.defaultUnit);
    }
  }, [initial, selectedItem, unit]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!itemId) return;
    setSubmitting(true);
    setError(null);
    try {
      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty < 0) {
        throw new Error("Quantity must be a non-negative integer.");
      }
      await setBoxItemQuantity({
        boxId,
        itemId: itemId as Id<"inventoryItems">,
        quantity: qty,
        unit: unit || undefined,
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
          <DialogTitle>
            {initial ? `Update ${initial.itemName}` : "Add item to box"}
          </DialogTitle>
          <DialogDescription>
            Box {boxLabel} • setting quantity to 0 removes the item from this
            box.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup>
            {!initial && (
              <Field>
                <FieldLabel htmlFor="boxitem-item">Item</FieldLabel>
                <Select value={itemId} onValueChange={setItemId}>
                  <SelectTrigger id="boxitem-item" className="w-full">
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {(items ?? []).map((item) => (
                      <SelectItem key={item._id} value={String(item._id)}>
                        {item.name}
                        {item.sku ? ` • ${item.sku}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="boxitem-qty">Quantity</FieldLabel>
                <Input
                  id="boxitem-qty"
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="boxitem-unit">Unit</FieldLabel>
                <Input
                  id="boxitem-unit"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="each"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="boxitem-notes">Notes</FieldLabel>
              <Textarea
                id="boxitem-notes"
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
            <Button type="submit" disabled={submitting || !itemId}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
