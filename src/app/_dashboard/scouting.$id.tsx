import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Target } from "lucide-react";

export const Route = createFileRoute("/_dashboard/scouting/$id")({
  component: ScoutingReportPage,
});

function ScoutingReportPage() {
  const { id } = Route.useParams();
  const reportId = id as Id<"scoutingReports">;

  const report = useQuery(api.scouting.getReport, { reportId });

  if (report === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (report === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Report not found</h2>
        <p className="text-muted-foreground mb-4">
          The scouting report you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link to="/scouting">Back to Scouting</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/scouting">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Team {report.teamNumber}
          </h1>
          <Badge variant="outline" className="mt-2">
            {report.competitionName}
          </Badge>
        </div>
      </div>

      {/* Report Info */}
      <Card>
        <CardHeader>
          <CardTitle>Match Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.matchNumber && (
            <div>
              <p className="text-sm text-muted-foreground">Match Number</p>
              <p className="font-medium">{report.matchNumber}</p>
            </div>
          )}
          {report.alliance && (
            <div>
              <p className="text-sm text-muted-foreground">Alliance</p>
              <Badge variant={report.alliance === "red" ? "destructive" : "default"}>
                {report.alliance}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {report.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{report.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
