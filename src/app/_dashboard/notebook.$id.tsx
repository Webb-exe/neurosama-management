import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, User, Calendar } from "lucide-react";
import { FormattedDate } from "@/components/ui/timezone-date-input";

export const Route = createFileRoute("/_dashboard/notebook/$id")({
  component: NotebookEntryPage,
});

function NotebookEntryPage() {
  const { id } = Route.useParams();
  const entryId = id as Id<"engineeringNotebook">;

  const entry = useQuery(api.notebook.getEntry, { entryId });

  if (entry === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (entry === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Entry not found</h2>
        <p className="text-muted-foreground mb-4">
          The notebook entry you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link to="/notebook">Back to Notebook</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/notebook">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{entry.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {entry.authorName}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <FormattedDate timestamp={entry.entryDate} format="date" />
            </div>
            <Badge variant="secondary" className="capitalize">
              {entry.category}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: entry.content }} />
        </CardContent>
      </Card>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
