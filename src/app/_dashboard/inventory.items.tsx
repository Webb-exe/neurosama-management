import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCents } from "@/components/finance/money";
import {
  SupplierFormDialog,
  type SupplierFormValues,
} from "@/components/inventory/SupplierFormDialog";
import {
  ItemFormDialog,
  type ItemFormValues,
} from "@/components/inventory/ItemFormDialog";
import { StockAdjustDialog } from "@/components/inventory/StockAdjustDialog";

export const Route = createFileRoute("/_dashboard/inventory/items")({
  component: InventoryItemsPage,
});

function InventoryItemsPage() {
  const { hasPermission } = useAuthContext();
  const canView = hasPermission(PERMISSIONS.inventoryCatalogView);
  const canManageCatalog = hasPermission(PERMISSIONS.inventoryCatalogManage);
  const canManageStock = hasPermission(PERMISSIONS.inventoryStockManage);

  const [includeInactive, setIncludeInactive] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<
    Id<"inventorySuppliers"> | null
  >(null);
  const [search, setSearch] = useState("");

  const [supplierDialog, setSupplierDialog] = useState<{
    open: boolean;
    initial: SupplierFormValues | null;
  }>({ open: false, initial: null });
  const [itemDialog, setItemDialog] = useState<{
    open: boolean;
    initial: ItemFormValues | null;
  }>({ open: false, initial: null });
  const [stockDialog, setStockDialog] = useState<{
    open: boolean;
    item: {
      _id: Id<"inventoryItems">;
      name: string;
      total: number;
      usedOnRobot: number;
      usedByMember: number;
    } | null;
  }>({ open: false, item: null });

  const suppliers = useQuery(
    api.inventory.catalog.listSuppliers,
    canView ? { includeInactive: true, limit: 200 } : "skip",
  );
  const items = useQuery(
    api.inventory.catalog.listItems,
    canView
      ? {
          includeInactive,
          limit: 200,
          ...(supplierFilter ? { supplierId: supplierFilter } : {}),
        }
      : "skip",
  );

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(needle) ||
        item.sku?.toLowerCase().includes(needle) ||
        item.partNumber?.toLowerCase().includes(needle) ||
        item.supplierName.toLowerCase().includes(needle)
      );
    });
  }, [items, search]);

  if (!canView) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 text-sm text-muted-foreground">
          You don't have permission to view inventory items.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit rounded-xl border-border/60">
        <CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Suppliers</h3>
            {canManageCatalog && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setSupplierDialog({ open: true, initial: null })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> New
              </Button>
            )}
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSupplierFilter(null)}
              className={cn(
                "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                supplierFilter === null
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted/60",
              )}
            >
              All suppliers
            </button>
            {suppliers === undefined ? (
              <>
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </>
            ) : (
              suppliers.map((supplier) => (
                <div
                  key={supplier._id}
                  className={cn(
                    "group flex items-center gap-1 rounded-md",
                    supplierFilter === supplier._id && "bg-primary/10",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSupplierFilter(supplier._id)}
                    className={cn(
                      "flex-1 truncate px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60",
                      supplierFilter === supplier._id
                        ? "text-primary"
                        : "text-foreground",
                      !supplier.active && "text-muted-foreground",
                    )}
                  >
                    {supplier.name}
                    {!supplier.active ? " (inactive)" : ""}
                  </button>
                  {canManageCatalog && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() =>
                        setSupplierDialog({
                          open: true,
                          initial: {
                            _id: supplier._id,
                            name: supplier.name,
                            description: supplier.description,
                            contactName: supplier.contactName,
                            contactEmail: supplier.contactEmail,
                            websiteUrl: supplier.websiteUrl,
                            active: supplier.active,
                          },
                        })
                      }
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/60">
        <CardContent className="space-y-3 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search items"
                className="h-9 pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncludeInactive((prev) => !prev)}
              className={cn(includeInactive && "border-primary text-primary")}
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              {includeInactive ? "Showing inactive" : "Active only"}
            </Button>
            {canManageCatalog && (
              <Button
                size="sm"
                onClick={() =>
                  setItemDialog({ open: true, initial: null })
                }
                disabled={!suppliers || suppliers.length === 0}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New item
              </Button>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">
                    Qty (un / box / robot / member / total)
                  </TableHead>
                  <TableHead className="text-right">Default cost</TableHead>
                  <TableHead className="w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items === undefined ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      <Skeleton className="mx-auto h-5 w-32" />
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground"
                    >
                      No items match the current filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            {!item.active && (
                              <Badge variant="outline" className="text-[10px]">
                                Inactive
                              </Badge>
                            )}
                            {item.approvalStatus !== "approved" && (
                              <Badge variant="outline" className="text-[10px]">
                                {item.approvalStatus === "draft"
                                  ? "Draft"
                                  : "Rejected"}
                              </Badge>
                            )}
                            {item.disableOutOfStockWarnings && (
                              <Badge variant="outline" className="text-[10px]">
                                Stock warnings off
                              </Badge>
                            )}
                          </div>
                          {(item.sku || item.partNumber) && (
                            <span className="text-xs text-muted-foreground">
                              {[item.sku, item.partNumber]
                                .filter(Boolean)
                                .join(" • ")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.supplierName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={cn(
                            "font-medium",
                            item.totalQuantity <= 0 &&
                              !item.disableOutOfStockWarnings &&
                              "text-amber-600",
                          )}
                        >
                          {item.unsortedQuantity} / {item.boxedQuantity} /{" "}
                          {item.usedOnRobotQuantity} /{" "}
                          {item.usedByMemberQuantity} / {item.totalQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                        {item.defaultUnitCostCents !== undefined
                          ? `${formatCents(item.defaultUnitCostCents)} / ${item.defaultUnit}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {canManageStock && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setStockDialog({
                                  open: true,
                                  item: {
                                    _id: item._id,
                                    name: item.name,
                                    total: item.totalQuantity,
                                    usedOnRobot: item.usedOnRobotQuantity,
                                    usedByMember: item.usedByMemberQuantity,
                                  },
                                })
                              }
                            >
                              Adjust
                            </Button>
                          )}
                          {canManageCatalog && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() =>
                                setItemDialog({
                                  open: true,
                                  initial: {
                                    _id: item._id,
                                    name: item.name,
                                    description: item.description,
                                    supplierId: item.supplierId,
                                    sku: item.sku,
                                    partNumber: item.partNumber,
                                    defaultUnit: item.defaultUnit,
                                    defaultUnitCostCents:
                                      item.defaultUnitCostCents,
                                    disableOutOfStockWarnings:
                                      item.disableOutOfStockWarnings,
                                    active: item.active,
                                  },
                                })
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SupplierFormDialog
        open={supplierDialog.open}
        onOpenChange={(open) =>
          setSupplierDialog((prev) => ({ ...prev, open }))
        }
        initial={supplierDialog.initial}
      />
      <ItemFormDialog
        open={itemDialog.open}
        onOpenChange={(open) => setItemDialog((prev) => ({ ...prev, open }))}
        initial={itemDialog.initial}
        defaultSupplierId={supplierFilter ?? undefined}
        suppliers={suppliers ?? []}
      />
      {stockDialog.item && (
        <StockAdjustDialog
          open={stockDialog.open}
          onOpenChange={(open) =>
            setStockDialog((prev) => ({ ...prev, open }))
          }
          itemId={stockDialog.item._id}
          itemName={stockDialog.item.name}
          currentTotal={stockDialog.item.total}
          currentUsedOnRobot={stockDialog.item.usedOnRobot}
          currentUsedByMember={stockDialog.item.usedByMember}
        />
      )}
    </div>
  );
}
