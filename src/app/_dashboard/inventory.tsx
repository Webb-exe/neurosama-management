import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Package, Plus, Search, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_dashboard/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  const { results, status, loadMore } = usePaginatedQuery(
    api.inventory.listParts,
    { search: search || undefined, category: categoryFilter },
    { initialNumItems: 20 }
  );

  const stats = useQuery(api.inventory.getInventoryStats);
  const categories = useQuery(api.inventory.getCategories);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Parts Inventory
          </h1>
          <p className="text-muted-foreground">
            Track your robot parts and supplies
          </p>
        </div>
        <Button asChild>
          <Link to="/inventory/$id" params={{ id: "new" }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Part
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalParts}</div>
              <p className="text-xs text-muted-foreground">Total Parts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalQuantity}</div>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-500">{stats.lowStockCount}</div>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-500">{stats.outOfStockCount}</div>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={categoryFilter === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(undefined)}
          >
            All
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Parts List */}
      {status === "LoadingFirstPage" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No parts found</h3>
            <p className="text-muted-foreground mb-4">
              {search ? "No parts match your search" : "Add your first part to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((part) => (
              <Link key={part._id} to="/inventory/$id" params={{ id: part._id }}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{part.name}</CardTitle>
                      {part.quantity <= (part.minStock || 0) && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="secondary">{part.category}</Badge>
                    <div className="flex items-center justify-between text-sm">
                      <span>Quantity: {part.quantity}</span>
                      {part.location && (
                        <span className="text-muted-foreground">{part.location}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {status === "CanLoadMore" && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => loadMore(20)}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
