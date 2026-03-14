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
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function parseTagValues(value: string | undefined, valueKind: "scalar" | "multi") {
  if (!value) {
    return [];
  }

  if (valueKind !== "multi") {
    return [value];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
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
  return Object.values(filters).filter((values) => values.length > 0).length;
}

function filterTagColumns(columns: TagColumn[], query: string) {
  if (!query.trim()) {
    return columns;
  }

  const normalizedQuery = query.trim().toLowerCase();
  return columns.filter((column) => {
    if (column.label.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    return column.values.some((value) => value.toLowerCase().includes(normalizedQuery));
  });
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
      ...data.tagColumns.map((column) => ({
        key: `tag:${column.key}` as const,
        label: column.label,
        kind: "tag" as const,
        tagKey: column.key,
        valueKind: column.valueKind,
      })),
    ],
    [data.tagColumns],
  );

  useEffect(() => {
    const nextVisibleColumns = columns.map((column) => column.key);
    setVisibleColumnKeys(nextVisibleColumns);
    setSortColumn("teamNumber");
    setSortDirection("asc");
    setSearchText("");
    setFilterSearchText("");
    setAppliedFilters({});
    setDraftFilters({});
  }, [columns, cycleId]);

  const visibleColumns = columns.filter((column) => visibleColumnKeys.includes(column.key));
  const filteredTagColumns = filterTagColumns(data.tagColumns, filterSearchText);
  const activeFilterCount = countActiveFilters(appliedFilters);

  const filteredRows = data.rows
    .filter((row) => {
      for (const column of data.tagColumns) {
        const selectedValues = appliedFilters[column.key] ?? [];
        if (selectedValues.length === 0) {
          continue;
        }

        const rowValues = parseTagValues(row.tags[column.key], column.valueKind);
        if (!selectedValues.some((value) => rowValues.includes(value))) {
          return false;
        }
      }

      if (!deferredSearchText.trim()) {
        return true;
      }

      const normalizedQuery = deferredSearchText.trim().toLowerCase();
      if (String(row.teamNumber).includes(normalizedQuery)) {
        return true;
      }

      return data.tagColumns.some((column) =>
        parseTagValues(row.tags[column.key], column.valueKind).some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
      );
    })
    .toSorted((left, right) => {
      let comparison = 0;

      if (sortColumn === "teamNumber") {
        comparison = left.teamNumber - right.teamNumber;
      } else if (sortColumn === "responseCount") {
        comparison = left.responseCount - right.responseCount;
      } else if (sortColumn === "lastResponseAt") {
        if (left.lastResponseAt === right.lastResponseAt) {
          comparison = 0;
        } else if (left.lastResponseAt === null) {
          comparison = 1;
        } else if (right.lastResponseAt === null) {
          comparison = -1;
        } else {
          comparison = left.lastResponseAt - right.lastResponseAt;
        }
      } else {
        const tagKey = sortColumn.replace("tag:", "");
        const column = data.tagColumns.find((entry) => entry.key === tagKey);
        const leftValue = formatTagValue(left.tags[tagKey], column?.valueKind ?? "scalar");
        const rightValue = formatTagValue(right.tags[tagKey], column?.valueKind ?? "scalar");

        if (leftValue === "—" && rightValue === "—") {
          comparison = 0;
        } else if (leftValue === "—") {
          comparison = 1;
        } else if (rightValue === "—") {
          comparison = -1;
        } else {
          comparison = compareAscii(leftValue, rightValue);
        }
      }

      if (comparison === 0) {
        comparison = left.teamNumber - right.teamNumber;
      }

      return sortDirection === "desc" ? comparison * -1 : comparison;
    });

  function toggleColumnVisibility(columnKey: SortColumnKey) {
    if (columnKey === "teamNumber") {
      return;
    }

    setVisibleColumnKeys((current) => {
      if (current.includes(columnKey)) {
        const next = current.filter((key) => key !== columnKey);
        return next.length > 0 ? next : ["teamNumber"];
      }

      return columns
        .map((column) => column.key)
        .filter((key) => key === columnKey || current.includes(key));
    });
  }

  function handleSort(columnKey: SortColumnKey) {
    startTransition(() => {
      if (sortColumn === columnKey) {
        setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
        return;
      }

      setSortColumn(columnKey);
      setSortDirection("asc");
    });
  }

  function openFilterDialog() {
    setDraftFilters(appliedFilters);
    setFilterSearchText("");
    setIsFilterDialogOpen(true);
  }

  function toggleDraftFilterValue(tagKey: string, value: string) {
    setDraftFilters((current) => {
      const currentValues = current[tagKey] ?? [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((entry) => entry !== value)
        : [...currentValues, value].toSorted(compareAscii);

      if (nextValues.length === 0) {
        const next = { ...current };
        delete next[tagKey];
        return next;
      }

      return {
        ...current,
        [tagKey]: nextValues,
      };
    });
  }

  function setDraftFilterValues(tagKey: string, values: string[]) {
    setDraftFilters((current) => {
      if (values.length === 0) {
        const next = { ...current };
        delete next[tagKey];
        return next;
      }

      return {
        ...current,
        [tagKey]: values,
      };
    });
  }

  function clearAllFilters() {
    setDraftFilters({});
  }

  const showClearButton = deferredSearchText.trim().length > 0 || activeFilterCount > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/90 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Selected cycle
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {filteredRows.length} of {data.rows.length} teams
            </Badge>
            {activeFilterCount > 0 ? (
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Tag table for {data.cycleName}</h3>
            <p className="text-sm text-muted-foreground">
              Sort by any visible column, choose which tags stay on screen, and filter from
              real values already saved in this cycle.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-72 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search team numbers or tag values"
              className="pl-9"
            />
          </div>

          <Button variant="outline" onClick={openFilterDialog} className="justify-between">
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </span>
            {activeFilterCount > 0 ? (
              <Badge variant="secondary" className="ml-2 rounded-full px-2">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3 className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={visibleColumnKeys.includes(column.key)}
                  disabled={column.key === "teamNumber"}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={() => toggleColumnVisibility(column.key)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {showClearButton ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchText("");
                setAppliedFilters({});
                setDraftFilters({});
              }}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/20 hover:bg-muted/20">
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "h-14 whitespace-nowrap bg-muted/20 text-xs font-semibold uppercase tracking-[0.18em]",
                      column.key === "teamNumber" ? "sticky left-0 z-10 bg-card" : "",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 text-left text-foreground"
                    >
                      <span>{column.label}</span>
                      {sortColumn === column.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-4 w-4 text-primary" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.teamNumber} className="border-border/50">
                  {visibleColumns.map((column) => {
                    if (column.key === "teamNumber") {
                      return (
                        <TableCell
                          key={column.key}
                          className="sticky left-0 z-[1] bg-card font-medium"
                        >
                          <Link
                            to="/scouting/team/$number"
                            params={{ number: String(row.teamNumber) }}
                            search={getScoutingSearch(cycleId)}
                            className="inline-flex flex-col gap-1 hover:underline"
                          >
                            <span className="text-base font-semibold">Team {row.teamNumber}</span>
                            <span className="text-xs text-muted-foreground">
                              Updated {dateFormatter.format(row.updatedAt)}
                            </span>
                          </Link>
                        </TableCell>
                      );
                    }

                    if (column.key === "responseCount") {
                      return <TableCell key={column.key}>{row.responseCount}</TableCell>;
                    }

                    if (column.key === "lastResponseAt") {
                      return (
                        <TableCell key={column.key}>
                          {row.lastResponseAt ? dateFormatter.format(row.lastResponseAt) : "—"}
                        </TableCell>
                      );
                    }

                    const tagKey = column.tagKey ?? "";
                    return (
                      <TableCell key={column.key} className="max-w-56 whitespace-normal">
                        {formatTagValue(row.tags[tagKey], column.valueKind ?? "scalar")}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredRows.length === 0 ? (
          <div className="border-t border-border/60 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No teams match the current search and filters for this cycle.
            </p>
          </div>
        ) : null}
      </div>

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-5xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border/70 px-6 pt-6 pb-4">
            <DialogTitle className="text-3xl">Edit Filters</DialogTitle>
            <DialogDescription>
              Pick one or more values for each tag. A team must match every active tag filter to
              stay in the table.
            </DialogDescription>
            <Input
              value={filterSearchText}
              onChange={(event) => setFilterSearchText(event.target.value)}
              placeholder="Search tag names or available values"
            />
          </DialogHeader>

          <ScrollArea className="max-h-[65vh] px-6 py-5">
            <div className="space-y-4">
              {filteredTagColumns.map((column) => {
                const selectedValues = draftFilters[column.key] ?? [];

                return (
                  <div
                    key={column.key}
                    className="rounded-[24px] border border-border/70 bg-background/80 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{column.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedValues.length > 0
                            ? `${selectedValues.length} selected`
                            : `${column.values.length} available value${column.values.length === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setDraftFilterValues(column.key, column.values)}
                        >
                          Select all
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setDraftFilterValues(column.key, [])}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {column.values.length > 0 ? (
                        column.values.map((value) => {
                          const isSelected = selectedValues.includes(value);
                          return (
                            <Button
                              key={value}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="rounded-full"
                              onClick={() => toggleDraftFilterValue(column.key, value)}
                            >
                              {value}
                            </Button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No saved values for this tag yet.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredTagColumns.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border/70 px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No tag filters match that search.
                  </p>
                </div>
              ) : null}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t border-border/70 px-6 py-4 sm:justify-between">
            <Button type="button" variant="ghost" onClick={clearAllFilters}>
              Clear all
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setIsFilterDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setAppliedFilters(draftFilters);
                    setIsFilterDialogOpen(false);
                  });
                }}
              >
                Apply filters
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
