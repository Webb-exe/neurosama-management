import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  Filter,
  Search,
  X,
} from "lucide-react";
import { getScoutingSearch } from "@/components/scouting/search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TagColumn = {
  key: string;
  label: string;
  valueKind: "scalar" | "multi";
  values: string[];
};

type AnalysisRow = {
  teamNumber: number;
  responseCount: number;
  lastResponseAt: number | null;
  updatedAt: number;
  tags: Record<string, string>;
};

type AnalysisData = {
  cycleId: string;
  cycleName: string;
  tagColumns: TagColumn[];
  rows: AnalysisRow[];
};

type SortDirection = "asc" | "desc";
type SortColumnKey = "teamNumber" | "responseCount" | "lastResponseAt" | `tag:${string}`;

type ColumnDefinition = {
  key: SortColumnKey;
  label: string;
  kind: "static" | "tag";
  tagKey?: string;
  valueKind?: "scalar" | "multi";
};

const staticColumns: ColumnDefinition[] = [
  { key: "teamNumber", label: "Team", kind: "static" },
  { key: "responseCount", label: "Responses", kind: "static" },
  { key: "lastResponseAt", label: "Last Response", kind: "static" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function compareAscii(left: string, right: string) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function parseTagValues(value: string | undefined, valueKind: "scalar" | "multi") {
  if (!value) return [];
  if (valueKind !== "multi") return [value];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    return [value];
  }
  return [value];
}

function formatTagValue(value: string | undefined, valueKind: "scalar" | "multi") {
  const values = parseTagValues(value, valueKind);
  return values.length > 0 ? values.join(", ") : "—";
}

function countActiveFilters(filters: Record<string, string[]>) {
  return Object.values(filters).filter((v) => v.length > 0).length;
}

function filterTagColumns(columns: TagColumn[], query: string) {
  if (!query.trim()) return columns;
  const q = query.trim().toLowerCase();
  return columns.filter(
    (col) =>
      col.label.toLowerCase().includes(q) ||
      col.values.some((v) => v.toLowerCase().includes(q)),
  );
}

export function TagAnalysisTable({
  cycleId,
  data,
}: {
  cycleId: string;
  data: AnalysisData;
}) {
  const [searchText, setSearchText] = useState("");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterSearchText, setFilterSearchText] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumnKey>("teamNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<SortColumnKey[]>(["teamNumber"]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [draftFilters, setDraftFilters] = useState<Record<string, string[]>>({});
  const deferredSearchText = useDeferredValue(searchText);

  const columns = useMemo<ColumnDefinition[]>(
    () => [
      ...staticColumns,
      ...data.tagColumns.map((col) => ({
        key: `tag:${col.key}` as const,
        label: col.label,
        kind: "tag" as const,
        tagKey: col.key,
        valueKind: col.valueKind,
      })),
    ],
    [data.tagColumns],
  );

  useEffect(() => {
    setVisibleColumnKeys(columns.map((c) => c.key));
    setSortColumn("teamNumber");
    setSortDirection("asc");
    setSearchText("");
    setFilterSearchText("");
    setAppliedFilters({});
    setDraftFilters({});
  }, [columns, cycleId]);

  const visibleColumns = columns.filter((c) => visibleColumnKeys.includes(c.key));
  const filteredTagColumns = filterTagColumns(data.tagColumns, filterSearchText);
  const activeFilterCount = countActiveFilters(appliedFilters);

  const filteredRows = data.rows
    .filter((row) => {
      for (const col of data.tagColumns) {
        const sel = appliedFilters[col.key] ?? [];
        if (sel.length === 0) continue;
        const rowVals = parseTagValues(row.tags[col.key], col.valueKind);
        if (!sel.some((v) => rowVals.includes(v))) return false;
      }
      if (!deferredSearchText.trim()) return true;
      const q = deferredSearchText.trim().toLowerCase();
      if (String(row.teamNumber).includes(q)) return true;
      return data.tagColumns.some((col) =>
        parseTagValues(row.tags[col.key], col.valueKind).some((v) =>
          v.toLowerCase().includes(q),
        ),
      );
    })
    .toSorted((a, b) => {
      let cmp = 0;
      if (sortColumn === "teamNumber") {
        cmp = a.teamNumber - b.teamNumber;
      } else if (sortColumn === "responseCount") {
        cmp = a.responseCount - b.responseCount;
      } else if (sortColumn === "lastResponseAt") {
        if (a.lastResponseAt === b.lastResponseAt) cmp = 0;
        else if (a.lastResponseAt === null) cmp = 1;
        else if (b.lastResponseAt === null) cmp = -1;
        else cmp = a.lastResponseAt - b.lastResponseAt;
      } else {
        const tagKey = sortColumn.replace("tag:", "");
        const col = data.tagColumns.find((c) => c.key === tagKey);
        const lv = formatTagValue(a.tags[tagKey], col?.valueKind ?? "scalar");
        const rv = formatTagValue(b.tags[tagKey], col?.valueKind ?? "scalar");
        if (lv === "—" && rv === "—") cmp = 0;
        else if (lv === "—") cmp = 1;
        else if (rv === "—") cmp = -1;
        else cmp = compareAscii(lv, rv);
      }
      if (cmp === 0) cmp = a.teamNumber - b.teamNumber;
      return sortDirection === "desc" ? cmp * -1 : cmp;
    });

  function toggleColumnVisibility(key: SortColumnKey) {
    if (key === "teamNumber") return;
    setVisibleColumnKeys((cur) => {
      if (cur.includes(key)) {
        const next = cur.filter((k) => k !== key);
        return next.length > 0 ? next : ["teamNumber"];
      }
      return columns.map((c) => c.key).filter((k) => k === key || cur.includes(k));
    });
  }

  function handleSort(key: SortColumnKey) {
    startTransition(() => {
      if (sortColumn === key) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return;
      }
      setSortColumn(key);
      setSortDirection("asc");
    });
  }

  function openFilterDialog() {
    setDraftFilters(appliedFilters);
    setFilterSearchText("");
    setIsFilterDialogOpen(true);
  }

  function toggleDraftFilterValue(tagKey: string, value: string) {
    setDraftFilters((cur) => {
      const vals = cur[tagKey] ?? [];
      const next = vals.includes(value)
        ? vals.filter((v) => v !== value)
        : [...vals, value].toSorted(compareAscii);
      if (next.length === 0) {
        const copy = { ...cur };
        delete copy[tagKey];
        return copy;
      }
      return { ...cur, [tagKey]: next };
    });
  }

  function setDraftFilterValues(tagKey: string, values: string[]) {
    setDraftFilters((cur) => {
      if (values.length === 0) {
        const copy = { ...cur };
        delete copy[tagKey];
        return copy;
      }
      return { ...cur, [tagKey]: values };
    });
  }

  const showClearButton = deferredSearchText.trim().length > 0 || activeFilterCount > 0;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/90 p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{data.cycleName}</span>
          <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px]">
            {filteredRows.length}/{data.rows.length} teams
          </Badge>
          {activeFilterCount > 0 && (
            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
              {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search teams or tags…"
              className="h-8 pl-8 text-sm"
            />
          </div>

          <div className="flex gap-1.5">
            <Button variant="outline" size="xs" onClick={openFilterDialog}>
              <Filter className="mr-1 h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="xs">
                  <Columns3 className="mr-1 h-3.5 w-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Visible columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={visibleColumnKeys.includes(col.key)}
                    disabled={col.key === "teamNumber"}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => toggleColumnVisibility(col.key)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {showClearButton && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSearchText("");
                  setAppliedFilters({});
                  setDraftFilters({});
                }}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/20 hover:bg-muted/20">
                {visibleColumns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "h-10 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider",
                      col.key === "teamNumber" ? "sticky left-0 z-10 bg-card" : "",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1.5 text-left text-foreground"
                    >
                      <span>{col.label}</span>
                      {sortColumn === col.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                      )}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.teamNumber} className="border-border/40">
                  {visibleColumns.map((col) => {
                    if (col.key === "teamNumber") {
                      return (
                        <TableCell key={col.key} className="sticky left-0 z-[1] bg-card py-2">
                          <Link
                            to="/scouting/team/$number"
                            params={{ number: String(row.teamNumber) }}
                            search={getScoutingSearch(cycleId)}
                            className="font-medium hover:underline"
                          >
                            {row.teamNumber}
                          </Link>
                        </TableCell>
                      );
                    }
                    if (col.key === "responseCount") {
                      return (
                        <TableCell key={col.key} className="py-2 text-sm">
                          {row.responseCount}
                        </TableCell>
                      );
                    }
                    if (col.key === "lastResponseAt") {
                      return (
                        <TableCell key={col.key} className="py-2 text-sm text-muted-foreground">
                          {row.lastResponseAt ? dateFormatter.format(row.lastResponseAt) : "—"}
                        </TableCell>
                      );
                    }
                    const tagKey = col.tagKey ?? "";
                    return (
                      <TableCell key={col.key} className="max-w-48 py-2 text-sm whitespace-normal">
                        {formatTagValue(row.tags[tagKey], col.valueKind ?? "scalar")}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredRows.length === 0 && (
          <div className="border-t border-border/50 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No teams match the current filters.</p>
          </div>
        )}
      </div>

      {/* Filter dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border/60 px-5 pt-5 pb-3">
            <DialogTitle>Filters</DialogTitle>
            <DialogDescription>
              Pick values for each tag. A team must match every active filter.
            </DialogDescription>
            <Input
              value={filterSearchText}
              onChange={(e) => setFilterSearchText(e.target.value)}
              placeholder="Search tags…"
              className="mt-2 h-8 text-sm"
            />
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] px-5 py-4">
            <div className="space-y-3">
              {filteredTagColumns.map((col) => {
                const selected = draftFilters[col.key] ?? [];
                return (
                  <div key={col.key} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{col.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {selected.length > 0
                            ? `${selected.length} selected`
                            : `${col.values.length} value${col.values.length === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="xs" onClick={() => setDraftFilterValues(col.key, col.values)}>
                          All
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => setDraftFilterValues(col.key, [])}>
                          None
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {col.values.length > 0 ? (
                        col.values.map((val) => (
                          <Button
                            key={val}
                            type="button"
                            variant={selected.includes(val) ? "default" : "outline"}
                            size="xs"
                            className="rounded-full"
                            onClick={() => toggleDraftFilterValue(col.key, val)}
                          >
                            {val}
                          </Button>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No values yet.</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredTagColumns.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No tags match that search.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t border-border/60 px-5 py-3 sm:justify-between">
            <Button variant="ghost" size="sm" onClick={() => setDraftFilters({})}>
              Clear all
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFilterDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  startTransition(() => {
                    setAppliedFilters(draftFilters);
                    setIsFilterDialogOpen(false);
                  });
                }}
              >
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
