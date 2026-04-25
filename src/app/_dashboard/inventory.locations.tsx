import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ShelfFormDialog,
  type ShelfFormValues,
} from "@/components/inventory/ShelfFormDialog";
import {
  BoxFormDialog,
  type BoxFormValues,
} from "@/components/inventory/BoxFormDialog";
import { BoxItemQuantityDialog } from "@/components/inventory/BoxItemQuantityDialog";

export const Route = createFileRoute("/_dashboard/inventory/locations")({
  component: InventoryLocationsPage,
});

type Shelf = NonNullable<
  ReturnType<
    typeof useQuery<typeof api.inventory.locations.listShelves>
  >
>[number];

type Box = Shelf["boxes"][number];
type BoxItem = Box["items"][number];

function InventoryLocationsPage() {
  const { hasPermission } = useAuthContext();
  const canView = hasPermission(PERMISSIONS.inventoryLocationsView);
  const canManageLocations = hasPermission(
    PERMISSIONS.inventoryLocationsManage,
  );
  const canManageStock = hasPermission(PERMISSIONS.inventoryStockManage);

  const [includeInactive, setIncludeInactive] = useState(false);

  const shelves = useQuery(
    api.inventory.locations.listShelves,
    canView
      ? { includeInactive, includeBoxes: true, limit: 200 }
      : "skip",
  );

  const [shelfDialog, setShelfDialog] = useState<{
    open: boolean;
    initial: ShelfFormValues | null;
  }>({ open: false, initial: null });
  const [boxDialog, setBoxDialog] = useState<{
    open: boolean;
    shelfId: Id<"storageShelves"> | null;
    initial: BoxFormValues | null;
  }>({ open: false, shelfId: null, initial: null });
  const [boxItemDialog, setBoxItemDialog] = useState<{
    open: boolean;
    boxId: Id<"storageBoxes"> | null;
    boxLabel: string;
    initial: {
      itemId: Id<"inventoryItems">;
      itemName: string;
      quantity: number;
      unit: string;
      notes: string;
    } | null;
  }>({ open: false, boxId: null, boxLabel: "", initial: null });

  if (!canView) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 text-sm text-muted-foreground">
          You don't have permission to view storage locations.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIncludeInactive((prev) => !prev)}
          className={cn(includeInactive && "border-primary text-primary")}
        >
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          {includeInactive ? "Showing inactive" : "Active only"}
        </Button>
        {canManageLocations && (
          <Button
            size="sm"
            onClick={() =>
              setShelfDialog({ open: true, initial: null })
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New shelf
          </Button>
        )}
      </div>

      {shelves === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : shelves.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No shelves yet.
            {canManageLocations
              ? " Create one to start placing boxes."
              : " Ask logistics to set up storage shelves."}
          </CardContent>
        </Card>
      ) : (
        shelves.map((shelf) => (
          <ShelfCard
            key={shelf._id}
            shelf={shelf}
            canManageLocations={canManageLocations}
            canManageStock={canManageStock}
            onEditShelf={() =>
              setShelfDialog({
                open: true,
                initial: {
                  _id: shelf._id,
                  name: shelf.name,
                  description: shelf.description,
                  physicalLocationLabel: shelf.physicalLocationLabel,
                  sortOrder: shelf.sortOrder,
                  active: shelf.active,
                },
              })
            }
            onAddBox={() =>
              setBoxDialog({
                open: true,
                shelfId: shelf._id,
                initial: null,
              })
            }
            onEditBox={(box) =>
              setBoxDialog({
                open: true,
                shelfId: shelf._id,
                initial: {
                  _id: box._id,
                  shelfId: shelf._id,
                  label: box.label,
                  description: box.description,
                  physicalLocationLabel: box.physicalLocationLabel,
                  visualRow: box.visualRow,
                  visualColumn: box.visualColumn,
                  visualRowSpan: box.visualRowSpan,
                  visualColumnSpan: box.visualColumnSpan,
                  active: box.active,
                },
              })
            }
            onAddItem={(box) =>
              setBoxItemDialog({
                open: true,
                boxId: box._id,
                boxLabel: box.label,
                initial: null,
              })
            }
            onEditItem={(box, item) =>
              setBoxItemDialog({
                open: true,
                boxId: box._id,
                boxLabel: box.label,
                initial: {
                  itemId: item.itemId,
                  itemName: item.itemName,
                  quantity: item.quantity,
                  unit: item.unit,
                  notes: item.notes,
                },
              })
            }
          />
        ))
      )}

      <ShelfFormDialog
        open={shelfDialog.open}
        onOpenChange={(open) =>
          setShelfDialog((prev) => ({ ...prev, open }))
        }
        initial={shelfDialog.initial}
      />
      {boxDialog.shelfId && (
        <BoxFormDialog
          open={boxDialog.open}
          onOpenChange={(open) =>
            setBoxDialog((prev) => ({ ...prev, open }))
          }
          shelfId={boxDialog.shelfId}
          initial={boxDialog.initial}
        />
      )}
      {boxItemDialog.boxId && (
        <BoxItemQuantityDialog
          open={boxItemDialog.open}
          onOpenChange={(open) =>
            setBoxItemDialog((prev) => ({ ...prev, open }))
          }
          boxId={boxItemDialog.boxId}
          boxLabel={boxItemDialog.boxLabel}
          initial={boxItemDialog.initial}
        />
      )}
    </div>
  );
}

function ShelfCard({
  shelf,
  canManageLocations,
  canManageStock,
  onEditShelf,
  onAddBox,
  onEditBox,
  onAddItem,
  onEditItem,
}: {
  shelf: Shelf;
  canManageLocations: boolean;
  canManageStock: boolean;
  onEditShelf: () => void;
  onAddBox: () => void;
  onEditBox: (box: Box) => void;
  onAddItem: (box: Box) => void;
  onEditItem: (box: Box, item: BoxItem) => void;
}) {
  const { rows, cols } = useMemo(() => {
    let maxRow = 1;
    let maxCol = 1;
    for (const box of shelf.boxes) {
      const r = (box.visualRow ?? 0) + (box.visualRowSpan ?? 1);
      const c = (box.visualColumn ?? 0) + (box.visualColumnSpan ?? 1);
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    }
    return { rows: Math.max(1, maxRow), cols: Math.max(1, maxCol) };
  }, [shelf.boxes]);

  const positionedBoxes = shelf.boxes.filter(
    (box) => box.visualRow !== undefined && box.visualColumn !== undefined,
  );
  const unpositionedBoxes = shelf.boxes.filter(
    (box) => box.visualRow === undefined || box.visualColumn === undefined,
  );

  return (
    <Card className="rounded-xl border-border/60">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">{shelf.name}</h3>
              {!shelf.active && (
                <Badge variant="outline" className="text-[10px]">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {shelf.physicalLocationLabel}
              {shelf.description ? ` — ${shelf.description}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {canManageLocations && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEditShelf}
                  className="h-8"
                >
                  <Pencil className="mr-1 h-3 w-3" /> Edit shelf
                </Button>
                <Button size="sm" variant="outline" onClick={onAddBox}>
                  <Plus className="mr-1 h-3 w-3" /> Box
                </Button>
              </>
            )}
          </div>
        </div>

        {shelf.boxes.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            No boxes yet.
          </p>
        ) : (
          <>
            {positionedBoxes.length > 0 && (
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(80px, auto))`,
                }}
              >
                {positionedBoxes.map((box) => (
                  <BoxCard
                    key={box._id}
                    box={box}
                    canManageLocations={canManageLocations}
                    canManageStock={canManageStock}
                    onEditBox={() => onEditBox(box)}
                    onAddItem={() => onAddItem(box)}
                    onEditItem={(item) => onEditItem(box, item)}
                    style={{
                      gridColumnStart: (box.visualColumn ?? 0) + 1,
                      gridRowStart: (box.visualRow ?? 0) + 1,
                      gridColumnEnd: `span ${box.visualColumnSpan ?? 1}`,
                      gridRowEnd: `span ${box.visualRowSpan ?? 1}`,
                    }}
                  />
                ))}
              </div>
            )}
            {unpositionedBoxes.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {unpositionedBoxes.map((box) => (
                  <BoxCard
                    key={box._id}
                    box={box}
                    canManageLocations={canManageLocations}
                    canManageStock={canManageStock}
                    onEditBox={() => onEditBox(box)}
                    onAddItem={() => onAddItem(box)}
                    onEditItem={(item) => onEditItem(box, item)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BoxCard({
  box,
  canManageLocations,
  canManageStock,
  onEditBox,
  onAddItem,
  onEditItem,
  style,
}: {
  box: Box;
  canManageLocations: boolean;
  canManageStock: boolean;
  onEditBox: () => void;
  onAddItem: () => void;
  onEditItem: (item: BoxItem) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "flex h-full flex-col rounded-lg border border-border/60 bg-card/40 p-3",
        !box.active && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{box.label}</p>
          {(box.physicalLocationLabel || box.description) && (
            <p className="truncate text-xs text-muted-foreground">
              {box.physicalLocationLabel}
              {box.physicalLocationLabel && box.description ? " — " : ""}
              {box.description}
            </p>
          )}
        </div>
        {canManageLocations && (
          <Button size="icon-sm" variant="ghost" onClick={onEditBox}>
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="mt-2 flex-1 space-y-1">
        {box.items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No items.</p>
        ) : (
          box.items.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => canManageStock && onEditItem(item)}
              disabled={!canManageStock}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors",
                canManageStock && "hover:bg-muted/60",
                !canManageStock && "cursor-default",
              )}
            >
              <span className="truncate">{item.itemName}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {item.quantity} {item.unit}
              </span>
            </button>
          ))
        )}
      </div>
      {canManageStock && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddItem}
          className="mt-2 h-7 justify-start text-xs"
        >
          <Plus className="mr-1 h-3 w-3" /> Add item
        </Button>
      )}
    </div>
  );
}
