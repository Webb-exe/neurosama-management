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

type Supplier = {
  _id: Id<"inventorySuppliers">;
  name: string;
  active: boolean;
};

export type ItemFormValues = {
  _id: Id<"inventoryItems">;
  name: string;
  description: string;
  supplierId: Id<"inventorySuppliers">;
  sku?: string;
  partNumber?: string;
  defaultUnit: string;
  defaultUnitCostCents?: number;
  disableOutOfStockWarnings: boolean;
  active: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ItemFormValues | null;
  defaultSupplierId?: Id<"inventorySuppliers">;
  suppliers: Supplier[];
};

export function ItemFormDialog({
  open,
  onOpenChange,
  initial,
  defaultSupplierId,
  suppliers,
}: Props) {
  const createItem = useMutation(api.inventory.catalog.createItem);
  const updateItem = useMutation(api.inventory.catalog.updateItem);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [sku, setSku] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("each");
  const [unitCostInput, setUnitCostInput] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("0");
  const [disableOutOfStockWarnings, setDisableOutOfStockWarnings] =
    useState(false);
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setSupplierId(
        initial?.supplierId
          ? String(initial.supplierId)
          : defaultSupplierId
            ? String(defaultSupplierId)
            : suppliers[0]
              ? String(suppliers[0]._id)
              : "",
      );
      setSku(initial?.sku ?? "");
      setPartNumber(initial?.partNumber ?? "");
      setDefaultUnit(initial?.defaultUnit ?? "each");
      setUnitCostInput(centsToDollarsInput(initial?.defaultUnitCostCents));
      setTotalQuantity("0");
      setDisableOutOfStockWarnings(initial?.disableOutOfStockWarnings ?? false);
      setActive(initial?.active ?? true);
      setError(null);
    }
  }, [open, initial, defaultSupplierId, suppliers]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !supplierId) return;
    setSubmitting(true);
    setError(null);
    try {
      const unitCostCents = unitCostInput.trim()
        ? parseDollarsToCents(unitCostInput)
        : undefined;
      if (unitCostInput.trim() && unitCostCents === null) {
        throw new Error("Default unit cost must be a valid amount.");
      }

      if (initial) {
        await updateItem({
          itemId: initial._id,
          name,
          description,
          supplierId: supplierId as Id<"inventorySuppliers">,
          sku: sku || undefined,
          partNumber: partNumber || undefined,
          defaultUnit,
          defaultUnitCostCents: unitCostCents ?? undefined,
          disableOutOfStockWarnings,
          active,
        });
      } else {
        const total = Number(totalQuantity);
        if (!Number.isInteger(total)) {
          throw new Error("Initial quantity must be an integer.");
        }
        await createItem({
          name,
          description,
          supplierId: supplierId as Id<"inventorySuppliers">,
          sku: sku || undefined,
          partNumber: partNumber || undefined,
          defaultUnit,
          defaultUnitCostCents: unitCostCents ?? undefined,
          totalQuantity: total,
          disableOutOfStockWarnings,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit item" : "New item"}</DialogTitle>
          <DialogDescription>
            Inventory items belong to a supplier. Stock totals are tracked
            separately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="item-name">Name</FieldLabel>
              <Input
                id="item-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="item-supplier">Supplier</FieldLabel>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="item-supplier" className="w-full">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem
                      key={supplier._id}
                      value={String(supplier._id)}
                    >
                      {supplier.name}
                      {!supplier.active ? " (inactive)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="item-description">Description</FieldLabel>
              <Textarea
                id="item-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="item-sku">SKU</FieldLabel>
                <Input
                  id="item-sku"
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="item-part">Part #</FieldLabel>
                <Input
                  id="item-part"
                  value={partNumber}
                  onChange={(event) => setPartNumber(event.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="item-unit">Default unit</FieldLabel>
                <Input
                  id="item-unit"
                  value={defaultUnit}
                  onChange={(event) => setDefaultUnit(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="item-cost">Default cost ($)</FieldLabel>
                <Input
                  id="item-cost"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={unitCostInput}
                  onChange={(event) => setUnitCostInput(event.target.value)}
                />
              </Field>
            </div>
            {!initial && (
              <Field>
                <FieldLabel htmlFor="item-total">Initial total qty</FieldLabel>
                <Input
                  id="item-total"
                  type="number"
                  step="1"
                  value={totalQuantity}
                  onChange={(event) => setTotalQuantity(event.target.value)}
                />
              </Field>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={disableOutOfStockWarnings}
                onChange={(event) =>
                  setDisableOutOfStockWarnings(event.target.checked)
                }
                className="h-4 w-4"
              />
              Disable out-of-stock warnings
            </label>
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
              disabled={submitting || !name.trim() || !supplierId}
            >
              {submitting ? "Saving…" : initial ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
