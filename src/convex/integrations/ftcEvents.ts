"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

const FTC_EVENTS_BASE_URL = "https://ftc-api.firstinspires.org";

const tournamentLevelValidator = v.union(
  v.literal("qual"),
  v.literal("playoff"),
);

const matchResultValidator = v.object({
  actualStartTime: v.union(v.string(), v.null()),
  description: v.union(v.string(), v.null()),
  tournamentLevel: v.union(v.string(), v.null()),
  series: v.number(),
  matchNumber: v.number(),
  scoreRedFinal: v.number(),
  scoreRedFoul: v.number(),
  scoreRedAuto: v.number(),
  scoreBlueFinal: v.number(),
  scoreBlueFoul: v.number(),
  scoreBlueAuto: v.number(),
  postResultTime: v.union(v.string(), v.null()),
  videoURL: v.union(v.string(), v.null()),
  teams: v.array(v.any()),
  modifiedOn: v.union(v.string(), v.null()),
});

type FtcEventsMatchResultResponse = {
  matches?: Array<{
    actualStartTime?: string | null;
    description?: string | null;
    tournamentLevel?: string | null;
    series?: number;
    matchNumber?: number;
    scoreRedFinal?: number;
    scoreRedFoul?: number;
    scoreRedAuto?: number;
    scoreBlueFinal?: number;
    scoreBlueFoul?: number;
    scoreBlueAuto?: number;
    postResultTime?: string | null;
    videoURL?: string | null;
    teams?: unknown[] | null;
    modifiedOn?: string | null;
  }> | null;
};

type FtcEventsScoreDetailsResponse = {
  matchScores?: unknown[] | null;
};

function getAuthorizationHeader() {
  const authorization = process.env.FTC_EVENTS_AUTHORIZATION?.trim();
  if (!authorization) {
    throw new Error("FTC_EVENTS_AUTHORIZATION is not configured");
  }

  return authorization.toLowerCase().startsWith("basic ")
    ? authorization
    : `Basic ${authorization}`;
}

function buildFtcEventsUrl(
  path: string,
  query: Record<string, string | number | undefined>,
) {
  const url = new URL(path, FTC_EVENTS_BASE_URL);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function fetchFtcEvents<T>(
  path: string,
  query: Record<string, string | number | undefined> = {},
): Promise<T> {
  const url = buildFtcEventsUrl(path, query);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: getAuthorizationHeader(),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `FTC Events request failed with ${response.status} for ${url.pathname}: ${body}`,
    );
  }

  return (await response.json()) as T;
}

export const getEventMatchResults = action({
  args: {
    season: v.number(),
    eventCode: v.string(),
    tournamentLevel: v.optional(tournamentLevelValidator),
    teamNumber: v.optional(v.number()),
    matchNumber: v.optional(v.number()),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
  },
  returns: v.object({
    matches: v.array(matchResultValidator),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.auth.helpers.requireAuth, {});

    const payload = await fetchFtcEvents<FtcEventsMatchResultResponse>(
      `/v2.0/${args.season}/matches/${args.eventCode}`,
      {
        tournamentLevel: args.tournamentLevel,
        teamNumber: args.teamNumber,
        matchNumber: args.matchNumber,
        start: args.start,
        end: args.end,
      },
    );

    return {
      matches: (payload.matches ?? []).map((match) => ({
        actualStartTime: match.actualStartTime ?? null,
        description: match.description ?? null,
        tournamentLevel: match.tournamentLevel ?? null,
        series: match.series ?? 0,
        matchNumber: match.matchNumber ?? 0,
        scoreRedFinal: match.scoreRedFinal ?? 0,
        scoreRedFoul: match.scoreRedFoul ?? 0,
        scoreRedAuto: match.scoreRedAuto ?? 0,
        scoreBlueFinal: match.scoreBlueFinal ?? 0,
        scoreBlueFoul: match.scoreBlueFoul ?? 0,
        scoreBlueAuto: match.scoreBlueAuto ?? 0,
        postResultTime: match.postResultTime ?? null,
        videoURL: match.videoURL ?? null,
        teams: match.teams ?? [],
        modifiedOn: match.modifiedOn ?? null,
      })),
    };
  },
});

export const getEventScoreDetails = action({
  args: {
    season: v.number(),
    eventCode: v.string(),
    tournamentLevel: tournamentLevelValidator,
    teamNumber: v.optional(v.number()),
    matchNumber: v.optional(v.number()),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
  },
  returns: v.object({
    matchScores: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.auth.helpers.requireAuth, {});

    const payload = await fetchFtcEvents<FtcEventsScoreDetailsResponse>(
      `/v2.0/${args.season}/scores/${args.eventCode}/${args.tournamentLevel}`,
      {
        teamNumber: args.teamNumber,
        matchNumber: args.matchNumber,
        start: args.start,
        end: args.end,
      },
    );

    return {
      matchScores: payload.matchScores ?? [],
    };
  },
});
