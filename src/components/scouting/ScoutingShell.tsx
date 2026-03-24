import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Flag,
  Globe,
  Layers3,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { getScoutingSearch } from "@/components/scouting/search";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type NavId = "home" | "analysis" | "responses" | "forms" | "publicLinks" | "cycles";

type NavItem = {
  id: NavId;
  label: string;
  to: "/scouting" | "/scouting/analysis" | "/scouting/responses" | "/scouting/forms" | "/scouting/public-links" | "/scouting/cycles";
  icon: typeof Flag;
};

const dataNav: NavItem[] = [
  { id: "home", label: "Home", to: "/scouting", icon: Flag },
  { id: "analysis", label: "Analysis", to: "/scouting/analysis", icon: BarChart3 },
  { id: "responses", label: "Responses", to: "/scouting/responses", icon: ClipboardList },
];

const setupNav: NavItem[] = [
  { id: "cycles", label: "Cycles", to: "/scouting/cycles", icon: Layers3 },
  { id: "forms", label: "Forms", to: "/scouting/forms", icon: FileText },
  { id: "publicLinks", label: "Public links", to: "/scouting/public-links", icon: Globe },
];

function pathnameToActiveNav(pathname: string): NavId | null {
  if (pathname === "/scouting" || pathname === "/scouting/") {
    return "home";
  }
  if (pathname.startsWith("/scouting/team/")) {
    return null;
  }
  if (pathname.startsWith("/scouting/analysis")) {
    return "analysis";
  }
  if (pathname.startsWith("/scouting/responses")) {
    return "responses";
  }
  if (pathname.startsWith("/scouting/forms")) {
    return "forms";
  }
  if (pathname.startsWith("/scouting/public-links")) {
    return "publicLinks";
  }
  if (pathname.startsWith("/scouting/cycles")) {
    return "cycles";
  }
  return null;
}

type Props = {
  cycleId: string | undefined;
  onCycleChange: (cycleId: string) => void;
  children: ReactNode;
};

export function ScoutingShell({ cycleId, onCycleChange, children }: Props) {
  const cycles = useQuery(api.scouting.cycles.listCycles, {});
  const { hasPermission } = useAuthContext();
  const canManageForms = hasPermission(PERMISSIONS.scoutingFormsManage);
  const canManageCycles = hasPermission(PERMISSIONS.scoutingCyclesManage);
  const canViewResponses = hasPermission(PERMISSIONS.scoutingResponsesView);
  const canManagePublicLinks = canManageForms;
  const canCreateCycles = canManageCycles;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeNav = pathnameToActiveNav(pathname);

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => {
      if (item.id === "forms") return canManageForms;
      if (item.id === "cycles") return canManageCycles;
      if (item.id === "responses") return canViewResponses;
      if (item.id === "publicLinks") return canManagePublicLinks;
      return true;
    });

  const visibleData = filterItems(dataNav);
  const visibleSetup = filterItems(setupNav);

  const renderLink = (item: NavItem) => (
    <Link
      key={item.id}
      to={item.to}
      search={getScoutingSearch(cycleId)}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors lg:w-full lg:justify-start",
        activeNav === item.id
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Scouting</h1>
        <div className="flex w-full flex-col gap-1 sm:max-w-64 sm:shrink-0">
          <span className="text-xs font-medium text-muted-foreground">Cycle</span>
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
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 lg:w-48 lg:flex-col lg:gap-4 lg:overflow-visible lg:pb-0 lg:shrink-0">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="hidden px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 lg:block">
              Data
            </p>
            <div className="flex gap-1.5 lg:flex-col lg:gap-1">{visibleData.map(renderLink)}</div>
          </div>
          {visibleSetup.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-1">
              <p className="hidden px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 lg:block">
                Setup
              </p>
              <div className="flex gap-1.5 lg:flex-col lg:gap-1">{visibleSetup.map(renderLink)}</div>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          {cycles !== undefined && cycles.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
              {canCreateCycles
                ? "Create a cycle under Setup → Cycles to start collecting scouting data."
                : "Ask an admin to create a scouting cycle before using scouting."}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
