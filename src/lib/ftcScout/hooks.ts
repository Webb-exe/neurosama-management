import { useQuery } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Alliance } from "@/gql/graphql";
import { fetchFtcScout } from "./client";
import {
  FTC_SCOUT_SEASON,
  GET_CONFIGURED_TEAM_EVENTS_DOCUMENT,
  GET_EVENT_PAGE_DOCUMENT,
  GET_TEAM_PAGE_DOCUMENT,
  type FtcConfiguredTeamEventsResult,
  type FtcEventPageResult,
  type FtcMatch,
  type FtcMatchScoreAlliance,
  type FtcTeamPageResult,
  normalizeConfiguredTeamEventsResult,
  normalizeEventPageResult,
  normalizeTeamPageResult,
} from "./queries";

const FTC_SCOUT_QUERY_KEY = ["ftcScout"] as const;
const FTC_SCOUT_STALE_TIME_MS = 60_000;

type FtcEventsMatchResult = {
  actualStartTime: string | null;
  description: string | null;
  tournamentLevel: string | null;
  series: number;
  matchNumber: number;
  scoreRedFinal: number;
  scoreRedFoul: number;
  scoreRedAuto: number;
  scoreBlueFinal: number;
  scoreBlueFoul: number;
  scoreBlueAuto: number;
  postResultTime: string | null;
  videoURL: string | null;
  teams: Array<unknown>;
  modifiedOn: string | null;
};

type FtcScoutQueryResult<T> = {
  data: T | undefined;
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
};

function toFtcEventsTournamentLevel(match: FtcMatch) {
  return match.tournamentLevel === "Quals" ? "qual" : "playoff";
}

function buildMatchResultKey(
  tournamentLevel: string,
  series: number,
  matchNumber: number,
) {
  return `${tournamentLevel}:${series}:${matchNumber}`;
}

function createAllianceScore(
  alliance: Alliance.Red | Alliance.Blue,
  finalScore: number,
  autoScore: number,
  foulScore: number,
): FtcMatchScoreAlliance {
  return {
    alliance,
    autoLeavePoints: 0,
    autoLeave1: 0,
    autoLeave2: 0,
    autoArtifactPoints: 0,
    autoArtifactClassifiedPoints: 0,
    autoArtifactOverflowPoints: 0,
    autoPatternPoints: 0,
    autoClassifierState: [],
    dcBasePoints: 0,
    dcBase1: 0,
    dcBase2: 0,
    dcBaseBonus: 0,
    dcArtifactPoints: 0,
    dcArtifactClassifiedPoints: 0,
    dcArtifactOverflowPoints: 0,
    dcPatternPoints: 0,
    dcDepotPoints: 0,
    dcClassifierState: [],
    movementRp: false,
    goalRp: false,
    patternRp: false,
    autoPoints: autoScore,
    dcPoints: 0,
    minorsCommitted: 0,
    majorsCommitted: 0,
    minorsByOpp: 0,
    majorsByOpp: 0,
    penaltyPointsCommitted: foulScore,
    penaltyPointsByOpp: foulScore,
    totalPointsNp: finalScore - foulScore,
    totalPoints: finalScore,
  };
}

function mergeFtcEventsMatchResults(
  event: FtcEventPageResult,
  matchResults: FtcEventsMatchResult[],
): FtcEventPageResult {
  if (!event) {
    return event;
  }

  const resultsByMatch = new Map<string, FtcEventsMatchResult>();
  for (const result of matchResults) {
    const tournamentLevel = result.tournamentLevel?.toLowerCase();
    if (tournamentLevel !== "qual" && tournamentLevel !== "playoff") {
      continue;
    }

    resultsByMatch.set(
      buildMatchResultKey(tournamentLevel, result.series, result.matchNumber),
      result,
    );
  }

  return {
    ...event,
    matches: event.matches.map((match) => {
      const result = resultsByMatch.get(
        buildMatchResultKey(
          toFtcEventsTournamentLevel(match),
          match.series,
          match.matchNum,
        ),
      );

      if (!result) {
        return match;
      }

      return {
        ...match,
        description: result.description ?? match.description,
        hasBeenPlayed: true,
        actualStartTime: result.actualStartTime ?? match.actualStartTime,
        postResultTime: result.postResultTime ?? match.postResultTime,
        updatedAt: result.modifiedOn ?? match.updatedAt,
        scores: {
          __typename: "MatchScores2025",
          season: match.season,
          eventCode: match.eventCode,
          matchId: match.id,
          red: createAllianceScore(
            Alliance.Red,
            result.scoreRedFinal,
            result.scoreRedAuto,
            result.scoreRedFoul,
          ),
          blue: createAllianceScore(
            Alliance.Blue,
            result.scoreBlueFinal,
            result.scoreBlueAuto,
            result.scoreBlueFoul,
          ),
        },
      };
    }),
  };
}

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
  const getEventMatchResults = useAction(api.integrations.ftcEvents.getEventMatchResults);
  const query = useQuery({
    queryKey: [...FTC_SCOUT_QUERY_KEY, "eventPage", normalizedCode, FTC_SCOUT_SEASON],
    enabled: normalizedCode.length > 0,
    staleTime: FTC_SCOUT_STALE_TIME_MS,
    queryFn: async ({ signal }) => {
      const [data, matchResults] = await Promise.all([
        fetchFtcScout(
          GET_EVENT_PAGE_DOCUMENT,
          {
            code: normalizedCode,
            season: FTC_SCOUT_SEASON,
          },
          { signal },
        ),
        getEventMatchResults({
          season: FTC_SCOUT_SEASON,
          eventCode: normalizedCode,
        }),
      ]);

      return mergeFtcEventsMatchResults(
        normalizeEventPageResult(data.eventByCode),
        matchResults.matches,
      );
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
