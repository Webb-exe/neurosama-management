import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { AlertTriangle, Boxes, Package, Truck, Warehouse } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_dashboard/inventory/")({
  component: InventoryOverviewPage,
});

function InventoryOverviewPage() {
  const { hasPermission } = useAuthContext();
  const canViewCatalog = hasPermission(PERMISSIONS.inventoryCatalogView);
  const canViewLocations = hasPermission(PERMISSIONS.inventoryLocationsView);

  const items = useQuery(
    api.inventory.catalog.listItems,
    canViewCatalog ? { includeInactive: true, limit: 200 } : "skip",
  );
  const suppliers = useQuery(
    api.inventory.catalog.listSuppliers,
    canViewCatalog ? { includeInactive: true, limit: 200 } : "skip",
  );
  const shelves = useQuery(
    api.inventory.locations.listShelves,
    canViewLocations
      ? { includeInactive: true, includeBoxes: true, limit: 200 }
      : "skip",
  );

  if (!canViewCatalog && !canViewLocations) {
    return <NoAccess />;
  }

  const activeItems = items?.filter((item) => item.active) ?? [];
  const lowStockItems = activeItems.filter(
    (item) => item.totalQuantity <= 0 && !item.disableOutOfStockWarnings,
  );
  const activeSuppliers = suppliers?.filter((supplier) => supplier.active) ?? [];
  const totalBoxes =
    shelves?.reduce((acc, shelf) => acc + shelf.boxes.length, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Package}
          label="Active items"
          value={items === undefined ? null : String(activeItems.length)}
          subtext={
            items === undefined ? null : `${items.length} total in catalog`
          }
        />
        <KpiCard
          icon={AlertTriangle}
          label="Out of stock"
          value={items === undefined ? null : String(lowStockItems.length)}
          subtext={
            items === undefined
              ? null
              : lowStockItems.length === 0
                ? "All items have stock"
                : "Items with zero on-hand"
          }
          tone={lowStockItems.length > 0 ? "warning" : undefined}
        />
        <KpiCard
          icon={Truck}
          label="Suppliers"
          value={
            suppliers === undefined ? null : String(activeSuppliers.length)
          }
          subtext={
            suppliers === undefined ? null : `${suppliers.length} total`
          }
        />
        <KpiCard
          icon={Warehouse}
          label="Shelves & boxes"
          value={
            shelves === undefined ? null : `${shelves.length} / ${totalBoxes}`
          }
          subtext="Shelves / boxes"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="rounded-xl border-border/60">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Boxes className="h-4 w-4" /> Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 p-4 pt-0 sm:grid-cols-2">
            {canViewCatalog && (
              <Button asChild variant="outline" className="justify-start">
                <Link to="/inventory/items">
                  <Package className="mr-2 h-4 w-4" />
                  Browse items & suppliers
                </Link>
              </Button>
            )}
            {canViewLocations && (
              <Button asChild variant="outline" className="justify-start">
                <Link to="/inventory/locations">
                  <Warehouse className="mr-2 h-4 w-4" />
                  Manage storage locations
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {items !== undefined && lowStockItems.length > 0 && (
          <Card className="rounded-xl border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/10">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Out of stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-4 pt-0">
              {lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between rounded-md border border-border/40 bg-background/60 px-2 py-1.5 text-sm"
                >
                  <span className="truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.supplierName}
                  </span>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <p className="pt-1 text-xs text-muted-foreground">
                  +{lowStockItems.length - 5} more
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  tone,
}: {
  icon: typeof Package;
  label: string;
  value: string | null;
  subtext?: string | null;
  tone?: "warning";
}) {
  return (
    <Card className="rounded-xl border-border/60">
      <CardContent className="space-y-1 p-4">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wide">
            {label}
          </span>
          <Icon
            className={
              tone === "warning"
                ? "h-4 w-4 text-amber-500"
                : "h-4 w-4 text-muted-foreground"
            }
          />
        </div>
        {value === null ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        )}
        {subtext === null ? (
          <Skeleton className="h-3 w-24" />
        ) : (
          subtext && (
            <p className="text-xs text-muted-foreground">{subtext}</p>
          )
        )}
      </CardContent>
    </Card>
  );
}

function NoAccess() {
  return (
    <Card className="rounded-xl border-border/60">
      <CardContent className="p-6 text-sm text-muted-foreground">
        You don't have access to view inventory data. Ask an admin to assign you
        a logistics role.
      </CardContent>
    </Card>
  );
}
