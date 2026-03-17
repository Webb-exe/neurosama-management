import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Globe,
  Layers3,
  Flag,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { getScoutingSearch } from "@/components/scouting/search";
import { useAuthContext } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  active: "overview" | "analysis" | "responses" | "forms" | "publicLinks" | "cycles";
  cycleId?: string;
  onCycleChange: (cycleId: string) => void;
  children: ReactNode;
};

const navItems = [
  { id: "overview", label: "Overview", to: "/scouting", icon: Flag },
  { id: "analysis", label: "Analysis", to: "/scouting/analysis", icon: BarChart3 },
  { id: "responses", label: "Responses", to: "/scouting/responses", icon: ClipboardList },
  { id: "forms", label: "Forms", to: "/scouting/forms", icon: FileText },
  { id: "publicLinks", label: "Public Links", to: "/scouting/public-links", icon: Globe },
  { id: "cycles", label: "Cycles", to: "/scouting/cycles", icon: Layers3 },
] as const;

export function ScoutingFrame({
  title,
  description,
  active,
  cycleId,
  onCycleChange,
  children,
}: Props) {
  const cycles = useQuery(api.scouting.cycles.listCycles, {});
  const { user } = useAuthContext();
  const canManage = user?.role === "owner" || user?.role === "admin";
  const visibleNavItems = navItems.filter(
    (item) =>
      canManage ||
      (item.id !== "forms" &&
        item.id !== "publicLinks" &&
        item.id !== "cycles" &&
        item.id !== "responses"),
  );

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="gap-4 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-xl font-semibold sm:text-2xl">{title}</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              {description}
            </CardDescription>
          </div>

          <div className="w-full max-w-64 shrink-0 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Cycle</label>
            {cycles === undefined ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Select value={cycleId} onValueChange={onCycleChange}>
                <SelectTrigger className="h-9 w-full rounded-lg">
                  <SelectValue placeholder="Select a cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle._id} value={String(cycle._id)}>
                      {cycle.name}
                      {cycle.status === "archived" ? " (Archived)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {visibleNavItems.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            search={getScoutingSearch(cycleId)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              active === item.id
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      {cycles !== undefined && cycles.length === 0 ? (
        <Card className="rounded-xl">
          <CardHeader className="p-4">
            <CardTitle className="text-base">No Scouting Cycles</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-muted-foreground">
            {canManage
              ? "Create a cycle on the Cycles page to start collecting scouting data."
              : "Ask an admin to create a scouting cycle before using scouting."}
          </CardContent>
        </Card>
      ) : null}

      {children}
    </div>
  );
}
