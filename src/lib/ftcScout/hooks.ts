import { useQuery } from "@tanstack/react-query";
import { fetchFtcScout } from "./client";
import {
  FTC_SCOUT_SEASON,
  GET_CONFIGURED_TEAM_EVENTS_DOCUMENT,
  GET_EVENT_PAGE_DOCUMENT,
  GET_TEAM_PAGE_DOCUMENT,
  type FtcConfiguredTeamEventsResult,
  type FtcEventPageResult,
  type FtcTeamPageResult,
  normalizeConfiguredTeamEventsResult,
  normalizeEventPageResult,
  normalizeTeamPageResult,
} from "./queries";

const FTC_SCOUT_QUERY_KEY = ["ftcScout"] as const;
const FTC_SCOUT_STALE_TIME_MS = 60_000;

type FtcScoutQueryResult<T> = {
  data: T | undefined;
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
};

export function useFtcScoutConfiguredTeamEvents(
  teamNumber: number | null | undefined,
): FtcScoutQueryResult<FtcConfiguredTeamEventsResult> {
  const query = useQuery({
    queryKey: [...FTC_SCOUT_QUERY_KEY, "configuredTeamEvents", teamNumber, FTC_SCOUT_SEASON],
    enabled: typeof teamNumber === "number" && teamNumber > 0,
    staleTime: FTC_SCOUT_STALE_TIME_MS,
    queryFn: async ({ signal }) => {
      const data = await fetchFtcScout(
        GET_CONFIGURED_TEAM_EVENTS_DOCUMENT,
        {
          number: teamNumber as number,
          season: FTC_SCOUT_SEASON,
        },
        { signal },
      );

      return normalizeConfiguredTeamEventsResult(data.teamByNumber);
    },
  });

  return {
    data: query.data,
    error: query.error instanceof Error ? query.error.message : null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: async () => query.refetch(),
  };
}

export function useFtcScoutTeamPage(teamNumber: number): FtcScoutQueryResult<FtcTeamPageResult> {
  const query = useQuery({
    queryKey: [...FTC_SCOUT_QUERY_KEY, "teamPage", teamNumber, FTC_SCOUT_SEASON],
    enabled: Number.isInteger(teamNumber) && teamNumber > 0,
    staleTime: FTC_SCOUT_STALE_TIME_MS,
    queryFn: async ({ signal }) => {
      const data = await fetchFtcScout(
        GET_TEAM_PAGE_DOCUMENT,
        {
          number: teamNumber,
          season: FTC_SCOUT_SEASON,
        },
        { signal },
      );

      return normalizeTeamPageResult(data.teamByNumber);
    },
  });

  return {
    data: query.data,
    error: query.error instanceof Error ? query.error.message : null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: async () => query.refetch(),
  };
}

export function useFtcScoutEventPage(code: string): FtcScoutQueryResult<FtcEventPageResult> {
  const normalizedCode = code.trim().toUpperCase();
  const query = useQuery({
    queryKey: [...FTC_SCOUT_QUERY_KEY, "eventPage", normalizedCode, FTC_SCOUT_SEASON],
    enabled: normalizedCode.length > 0,
    staleTime: FTC_SCOUT_STALE_TIME_MS,
    queryFn: async ({ signal }) => {
      const data = await fetchFtcScout(
        GET_EVENT_PAGE_DOCUMENT,
        {
          code: normalizedCode,
          season: FTC_SCOUT_SEASON,
        },
        { signal },
      );

      return normalizeEventPageResult(data.eventByCode);
    },
  });

  return {
    data: query.data,
    error: query.error instanceof Error ? query.error.message : null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: async () => query.refetch(),
  };
}
