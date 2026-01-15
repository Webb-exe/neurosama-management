import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Target, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_dashboard/scouting")({
  component: ScoutingPage,
});

function ScoutingPage() {
  const [search, setSearch] = useState("");

  const { results, status, loadMore } = usePaginatedQuery(
    api.scouting.listReports,
    { search: search || undefined },
    { initialNumItems: 12 }
  );

  const stats = useQuery(api.scouting.getScoutingStats);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Scouting
          </h1>
          <p className="text-muted-foreground">
            Scout and analyze other teams
          </p>
        </div>
        <Button asChild>
          <Link to="/scouting/$id" params={{ id: "new" }}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">Total Reports</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.teamsScounted}</div>
              <p className="text-xs text-muted-foreground">Teams Scouted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.competitionsScounted}</div>
              <p className="text-xs text-muted-foreground">Competitions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by team number..."
          className="pl-10"
        />
      </div>

      {/* Reports List */}
      {status === "LoadingFirstPage" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No scouting reports found</h3>
            <p className="text-muted-foreground mb-4">
              {search ? "No reports match your search" : "Create your first scouting report"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((report) => (
              <Link key={report._id} to="/scouting/$id" params={{ id: report._id }}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">Team {report.teamNumber}</CardTitle>
                      <Badge variant="outline">{report.competitionName}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.notes || "No notes"}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Match: {report.matchNumber || "N/A"}</span>
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {status === "CanLoadMore" && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => loadMore(12)}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
