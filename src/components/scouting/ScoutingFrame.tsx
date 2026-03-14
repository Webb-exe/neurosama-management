import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Flag,
  Layers3,
  Sparkles,
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

type Props = {
  title: string;
  description: string;
  active: "overview" | "analysis" | "responses" | "forms" | "cycles";
  cycleId?: string;
  onCycleChange: (cycleId: string) => void;
  children: ReactNode;
};

const navItems = [
  { id: "overview", label: "Overview", to: "/scouting", icon: Flag },
  { id: "analysis", label: "Scouting Analysis", to: "/scouting/analysis", icon: BarChart3 },
  { id: "responses", label: "Responses", to: "/scouting/responses", icon: ClipboardList },
  { id: "forms", label: "Forms", to: "/scouting/forms", icon: FileText },
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
      canManage || (item.id !== "forms" && item.id !== "cycles" && item.id !== "responses"),
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-[36px] border-border/70 bg-card shadow-sm">
        <CardHeader className="gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Scouting workspace
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl sm:text-4xl">{title}</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-relaxed">
                {description}
              </CardDescription>
            </div>
          </div>

          <div className="min-w-72 space-y-2">
            <label className="text-sm font-medium">Scouting Cycle</label>
            <Select value={cycleId} onValueChange={onCycleChange}>
              <SelectTrigger className="h-11 w-full rounded-2xl bg-background/80 px-4">
                <SelectValue placeholder={cycles === undefined ? "Loading cycles..." : "Select a cycle"} />
              </SelectTrigger>
              <SelectContent>
                {(cycles ?? []).map((cycle) => (
                  <SelectItem key={cycle._id} value={String(cycle._id)}>
                    {cycle.name}
                    {cycle.status === "archived" ? " (Archived)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {visibleNavItems.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            search={getScoutingSearch(cycleId)}
            className={[
              "group rounded-[24px] border px-5 py-4 transition-all",
              active === item.id
                ? "border-primary/30 bg-primary/8 shadow-sm"
                : "border-border/70 bg-card hover:-translate-y-0.5 hover:bg-muted/30",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition-colors",
                  active === item.id ? "bg-primary text-primary-foreground" : "bg-muted/70",
                ].join(" ")}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">
                  {active === item.id ? "Current view" : "Open page"}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {cycles !== undefined && cycles.length === 0 ? (
        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle>No Scouting Cycles Yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
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
