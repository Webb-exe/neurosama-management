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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: Id<"inventoryItems">;
  itemName: string;
  currentTotal: number;
  currentUsedOnRobot: number;
  currentUsedByMember: number;
};

export function StockAdjustDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  currentTotal,
  currentUsedOnRobot,
  currentUsedByMember,
}: Props) {
  const adjustTotal = useMutation(api.inventory.locations.adjustTotalQuantity);
  const setUsedOnRobot = useMutation(
    api.inventory.locations.setUsedOnRobotQuantity,
  );
  const setUsedByMember = useMutation(
    api.inventory.locations.setUsedByMemberQuantity,
  );

  const [tab, setTab] = useState<"delta" | "robot" | "member">("delta");
  const [delta, setDelta] = useState("0");
  const [usedOnRobot, setUsedOnRobotValue] = useState("0");
  const [usedByMember, setUsedByMemberValue] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTab("delta");
      setDelta("0");
      setUsedOnRobotValue(String(currentUsedOnRobot));
      setUsedByMemberValue(String(currentUsedByMember));
      setError(null);
    }
  }, [open, currentUsedOnRobot, currentUsedByMember]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (tab === "delta") {
        const value = Number(delta);
        if (!Number.isInteger(value)) throw new Error("Delta must be an integer.");
        if (value === 0) {
          onOpenChange(false);
          return;
        }
        await adjustTotal({ itemId, deltaQuantity: value });
      } else if (tab === "robot") {
        const value = Number(usedOnRobot);
        if (!Number.isInteger(value) || value < 0)
          throw new Error("Used-on-robot must be a non-negative integer.");
        await setUsedOnRobot({ itemId, usedOnRobotQuantity: value });
      } else {
        const value = Number(usedByMember);
        if (!Number.isInteger(value) || value < 0)
          throw new Error("Used-by-member must be a non-negative integer.");
        await setUsedByMember({ itemId, usedByMemberQuantity: value });
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
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {itemName} — currently {currentTotal} total, {currentUsedOnRobot} on
            robot, {currentUsedByMember} used by members.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "delta" | "robot" | "member")}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="delta">Adjust total (±)</TabsTrigger>
            <TabsTrigger value="robot">Set used on robot</TabsTrigger>
            <TabsTrigger value="member">Set used by member</TabsTrigger>
          </TabsList>
          <form onSubmit={submit} className="space-y-4 pt-3">
            <TabsContent value="delta">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="stock-delta">
                    Delta (positive to add, negative to remove)
                  </FieldLabel>
                  <Input
                    id="stock-delta"
                    type="number"
                    step="1"
                    value={delta}
                    onChange={(event) => setDelta(event.target.value)}
                  />
                </Field>
                <p className="text-xs text-muted-foreground">
                  New total will be {currentTotal + (Number(delta) || 0)}.
                </p>
              </FieldGroup>
            </TabsContent>
            <TabsContent value="robot">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="stock-robot">
                    Used on robot quantity
                  </FieldLabel>
                  <Input
                    id="stock-robot"
                    type="number"
                    step="1"
                    min="0"
                    value={usedOnRobot}
                    onChange={(event) =>
                      setUsedOnRobotValue(event.target.value)
                    }
                  />
                </Field>
              </FieldGroup>
            </TabsContent>
            <TabsContent value="member">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="stock-member">
                    Used by member quantity
                  </FieldLabel>
                  <Input
                    id="stock-member"
                    type="number"
                    step="1"
                    min="0"
                    value={usedByMember}
                    onChange={(event) =>
                      setUsedByMemberValue(event.target.value)
                    }
                  />
                </Field>
              </FieldGroup>
            </TabsContent>
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
                {submitting ? "Saving…" : "Apply"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
