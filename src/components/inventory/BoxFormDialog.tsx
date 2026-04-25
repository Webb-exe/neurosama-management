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

export type BoxFormValues = {
  _id: Id<"storageBoxes">;
  shelfId: Id<"storageShelves">;
  label: string;
  description: string;
  physicalLocationLabel?: string;
  visualRow?: number;
  visualColumn?: number;
  visualRowSpan?: number;
  visualColumnSpan?: number;
  active: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shelfId: Id<"storageShelves">;
  initial?: BoxFormValues | null;
};

export function BoxFormDialog({
  open,
  onOpenChange,
  shelfId,
  initial,
}: Props) {
  const createBox = useMutation(api.inventory.locations.createBox);
  const updateBox = useMutation(api.inventory.locations.updateBox);

  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [physicalLocation, setPhysicalLocation] = useState("");
  const [row, setRow] = useState("");
  const [col, setCol] = useState("");
  const [rowSpan, setRowSpan] = useState("");
  const [colSpan, setColSpan] = useState("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLabel(initial?.label ?? "");
      setDescription(initial?.description ?? "");
      setPhysicalLocation(initial?.physicalLocationLabel ?? "");
      setRow(initial?.visualRow !== undefined ? String(initial.visualRow) : "");
      setCol(
        initial?.visualColumn !== undefined ? String(initial.visualColumn) : "",
      );
      setRowSpan(
        initial?.visualRowSpan !== undefined
          ? String(initial.visualRowSpan)
          : "",
      );
      setColSpan(
        initial?.visualColumnSpan !== undefined
          ? String(initial.visualColumnSpan)
          : "",
      );
      setActive(initial?.active ?? true);
      setError(null);
    }
  }, [open, initial]);

  const parseOpt = (value: string, name: string): number | undefined => {
    if (!value.trim()) return undefined;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(`${name} must be a non-negative integer.`);
    }
    return n;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!label.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        label,
        description,
        physicalLocationLabel: physicalLocation || undefined,
        visualRow: parseOpt(row, "Row"),
        visualColumn: parseOpt(col, "Column"),
        visualRowSpan: parseOpt(rowSpan, "Row span"),
        visualColumnSpan: parseOpt(colSpan, "Column span"),
        active,
      };
      if (initial) {
        await updateBox({ boxId: initial._id, ...payload });
      } else {
        await createBox({ shelfId, ...payload });
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
          <DialogTitle>{initial ? "Edit box" : "New box"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="box-label">Label</FieldLabel>
              <Input
                id="box-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="box-description">Description</FieldLabel>
              <Textarea
                id="box-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="box-physical">Physical location</FieldLabel>
              <Input
                id="box-physical"
                value={physicalLocation}
                onChange={(event) => setPhysicalLocation(event.target.value)}
                placeholder="e.g. Drawer 3"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="box-row">Visual row</FieldLabel>
                <Input
                  id="box-row"
                  type="number"
                  min="0"
                  step="1"
                  value={row}
                  onChange={(event) => setRow(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="box-col">Visual column</FieldLabel>
                <Input
                  id="box-col"
                  type="number"
                  min="0"
                  step="1"
                  value={col}
                  onChange={(event) => setCol(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="box-rowspan">Row span</FieldLabel>
                <Input
                  id="box-rowspan"
                  type="number"
                  min="1"
                  step="1"
                  value={rowSpan}
                  onChange={(event) => setRowSpan(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="box-colspan">Column span</FieldLabel>
                <Input
                  id="box-colspan"
                  type="number"
                  min="1"
                  step="1"
                  value={colSpan}
                  onChange={(event) => setColSpan(event.target.value)}
                />
              </Field>
            </div>
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
            <Button type="submit" disabled={submitting || !label.trim()}>
              {submitting ? "Saving…" : initial ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
