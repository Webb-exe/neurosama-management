export type ScoutingSearch = {
  cycleId: string | undefined;
  teamNumber: string | undefined;
  formId: string | undefined;
  showOpen: boolean;
  filterKey: string | undefined;
  filterValue: string | undefined;
  searchText: string | undefined;
  sortKey: string | undefined;
  sortDirection: "asc" | "desc";
};

export function parseCycleSearch(search: Record<string, unknown>): ScoutingSearch {
  return {
    cycleId: typeof search.cycleId === "string" ? search.cycleId : undefined,
    teamNumber:
      typeof search.teamNumber === "string" ? search.teamNumber : undefined,
    formId: typeof search.formId === "string" ? search.formId : undefined,
    showOpen:
      search.showOpen === true ||
      search.showOpen === "true" ||
      search.showOpen === 1 ||
      search.showOpen === "1",
    filterKey:
      typeof search.filterKey === "string" ? search.filterKey : undefined,
    filterValue:
      typeof search.filterValue === "string" ? search.filterValue : undefined,
    searchText:
      typeof search.searchText === "string" ? search.searchText : undefined,
    sortKey: typeof search.sortKey === "string" ? search.sortKey : undefined,
    sortDirection:
      search.sortDirection === "desc" ? "desc" : ("asc" as const),
  };
}

export function mergeScoutingSearch(
  previous: Partial<ScoutingSearch>,
  patch: Partial<ScoutingSearch>,
): ScoutingSearch {
  return {
    ...getScoutingSearch(previous.cycleId),
    ...previous,
    ...patch,
  };
}

export function getScoutingSearch(cycleId?: string): ScoutingSearch {
  return {
    cycleId,
    teamNumber: undefined,
    formId: undefined,
    showOpen: false,
    filterKey: undefined,
    filterValue: undefined,
    searchText: undefined,
    sortKey: undefined,
    sortDirection: "asc",
  };
}
