import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package } from "lucide-react";

export const Route = createFileRoute("/_dashboard/inventory/$id")({
  component: PartDetailPage,
});

function PartDetailPage() {
  const { id } = Route.useParams();
  const partId = id as Id<"partsInventory">;

  const part = useQuery(api.inventory.getPart, { partId });

  if (part === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (part === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Part not found</h2>
        <p className="text-muted-foreground mb-4">
          The part you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link to="/inventory">Back to Inventory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            {part.name}
          </h1>
        </div>
      </div>

      {/* Part Info */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <Badge variant="secondary" className="mt-1">{part.category}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Quantity</p>
            <p className="text-2xl font-bold">{part.quantity}</p>
          </div>
          {part.location && (
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p>{part.location}</p>
            </div>
          )}
          {part.partNumber && (
            <div>
              <p className="text-sm text-muted-foreground">Part Number</p>
              <p className="font-mono">{part.partNumber}</p>
            </div>
          )}
          {part.supplier && (
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p>{part.supplier}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
