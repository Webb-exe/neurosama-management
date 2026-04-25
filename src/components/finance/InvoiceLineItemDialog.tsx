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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  centsToDollarsInput,
  parseDollarsToCents,
} from "@/components/finance/money";

export type LineItemFormValues = {
  _id: Id<"invoiceLineItems">;
  itemId: Id<"inventoryItems">;
  itemName: string;
  itemSku?: string;
  itemPartNumber?: string;
  description: string;
  quantity: number;
  unit: string;
  unitCostCents: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: Id<"invoices">;
  supplierId: Id<"inventorySuppliers">;
  initial?: LineItemFormValues | null;
};

export function InvoiceLineItemDialog({
  open,
  onOpenChange,
  invoiceId,
  supplierId,
  initial,
}: Props) {
  const upsertLineItem = useMutation(api.inventory.invoices.upsertLineItem);

  const items = useQuery(
    api.inventory.catalog.listItems,
    open
      ? {
          includeInactive: initial !== null && initial !== undefined,
          supplierId,
          limit: 200,
        }
      : "skip",
  );

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [itemId, setItemId] = useState<string>("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemSku, setNewItemSku] = useState("");
  const [newItemPartNumber, setNewItemPartNumber] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode("existing");
      setItemId(initial ? String(initial.itemId) : "");
      setNewItemName("");
      setNewItemSku("");
      setNewItemPartNumber("");
      setDescription(initial?.description ?? "");
      setQuantity(initial ? String(initial.quantity) : "1");
      setUnit(initial?.unit ?? "");
      setUnitCost(centsToDollarsInput(initial?.unitCostCents));
      setError(null);
    }
  }, [open, initial]);

  const handleItemChange = (nextItemId: string) => {
    setItemId(nextItemId);

    const nextItem = items?.find((item) => String(item._id) === nextItemId);
    if (!nextItem) return;

    setUnit(nextItem.defaultUnit);
    setUnitCost(centsToDollarsInput(nextItem.defaultUnitCostCents));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error("Quantity must be a positive integer.");
      }
      const unitCostCents = parseDollarsToCents(unitCost);
      if (unitCostCents === null || unitCostCents < 0) {
        throw new Error("Unit cost must be a non-negative dollar amount.");
      }

      const baseArgs = {
        invoiceId,
        description: description || undefined,
        quantity: qty,
        unit: unit || undefined,
        unitCostCents,
      };

      if (initial) {
        if (!itemId) throw new Error("Choose an item.");
        await upsertLineItem({
          ...baseArgs,
          lineItemId: initial._id,
          itemId: itemId as Id<"inventoryItems">,
        });
      } else if (mode === "existing") {
        if (!itemId) throw new Error("Choose an item.");
        await upsertLineItem({
          ...baseArgs,
          itemId: itemId as Id<"inventoryItems">,
        });
      } else {
        if (!newItemName.trim()) throw new Error("New item name is required.");
        await upsertLineItem({
          ...baseArgs,
          newItem: {
            name: newItemName,
            sku: newItemSku || undefined,
            partNumber: newItemPartNumber || undefined,
            defaultUnit: unit || undefined,
            defaultUnitCostCents: unitCostCents,
          },
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit line item" : "Add line item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!initial ? (
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as "existing" | "new")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing item</TabsTrigger>
                <TabsTrigger value="new">New item</TabsTrigger>
              </TabsList>
              <TabsContent value="existing">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="line-item">Item</FieldLabel>
                    <Select value={itemId} onValueChange={handleItemChange}>
                      <SelectTrigger id="line-item" className="w-full">
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
                </FieldGroup>
              </TabsContent>
              <TabsContent value="new">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="line-newname">Item name</FieldLabel>
                    <Input
                      id="line-newname"
                      value={newItemName}
                      onChange={(event) => setNewItemName(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="line-newsku">SKU</FieldLabel>
                    <Input
                      id="line-newsku"
                      value={newItemSku}
                      onChange={(event) => setNewItemSku(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="line-newpart">Part #</FieldLabel>
                    <Input
                      id="line-newpart"
                      value={newItemPartNumber}
                      onChange={(event) =>
                        setNewItemPartNumber(event.target.value)
                      }
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>
            </Tabs>
          ) : (
            <Field>
              <FieldLabel htmlFor="line-item-edit">Item</FieldLabel>
              <Select value={itemId} onValueChange={handleItemChange}>
                <SelectTrigger id="line-item-edit" className="w-full">
                  <SelectValue />
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

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="line-description">Description</FieldLabel>
              <Textarea
                id="line-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="line-qty">Quantity</FieldLabel>
                <Input
                  id="line-qty"
                  type="number"
                  step="1"
                  min="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="line-unit">Unit</FieldLabel>
                <Input
                  id="line-unit"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="each"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="line-cost">Unit cost ($)</FieldLabel>
                <Input
                  id="line-cost"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={unitCost}
                  onChange={(event) => setUnitCost(event.target.value)}
                />
              </Field>
            </div>
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
              {submitting ? "Saving…" : initial ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
