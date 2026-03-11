import { getFragmentData } from "@/gql/fragment-masking";
import {
  ClientAwardFieldsFragmentDoc,
  ClientEventDetailFieldsFragmentDoc,
  ClientEventListFieldsFragmentDoc,
  ClientLocationFieldsFragmentDoc,
  ClientMatchFieldsFragmentDoc,
  ClientMatchScoreAllianceFieldsFragmentDoc,
  ClientMatchTeamFieldsFragmentDoc,
  ClientQuickStatFieldsFragmentDoc,
  ClientQuickStatsFieldsFragmentDoc,
  ClientTeamFieldsFragmentDoc,
  GetConfiguredTeamEventsDocument,
  type GetConfiguredTeamEventsQuery,
  GetEventPageDocument,
  type GetEventPageQuery,
  GetTeamPageDocument,
  type GetTeamPageQuery,
  type Alliance,
  type AllianceRole,
  type AwardType,
  type EventType,
  type Station,
  type TournamentLevel,
} from "@/gql/graphql";

export const FTC_SCOUT_SEASON = 2025;

export const GET_CONFIGURED_TEAM_EVENTS_DOCUMENT = GetConfiguredTeamEventsDocument;
export const GET_TEAM_PAGE_DOCUMENT = GetTeamPageDocument;
export const GET_EVENT_PAGE_DOCUMENT = GetEventPageDocument;

export type FtcLocation = {
  venue?: string | null;
  city: string;
  state: string;
  country: string;
};

export type FtcQuickStat = {
  value: number;
  rank: number;
};

export type FtcQuickStats = {
  season: number;
  number: number;
  count: number;
  tot: FtcQuickStat;
  auto: FtcQuickStat;
  dc: FtcQuickStat;
  eg: FtcQuickStat;
};

export type FtcTeamProfile = {
  number: number;
  name: string;
  schoolName: string;
  rookieYear: number;
  website?: string | null;
  location: FtcLocation;
  quickStats?: FtcQuickStats | null;
};

export type FtcConfiguredTeamEvent = {
  season: number;
  code: string;
  name: string;
  type: EventType;
  location: FtcLocation;
  start: string;
  end: string;
  timezone: string;
  finished: boolean;
  ongoing: boolean;
  started: boolean;
};

export type FtcConfiguredTeamEventsResult = {
  number: number;
  name: string;
  events: Array<{
    event: FtcConfiguredTeamEvent;
  }>;
} | null;

export type FtcTeamPageAward = {
  teamNumber: number;
  type: AwardType;
  personName?: string | null;
  placement: number;
  divisionName?: string | null;
};

export type FtcTeamPageEvent = FtcConfiguredTeamEvent;

export type FtcTeamSummary = FtcTeamProfile & {
  events: Array<{
    awards: FtcTeamPageAward[];
    event: FtcTeamPageEvent;
  }>;
};

export type FtcTeamPageResult = FtcTeamSummary | null;

export type FtcMatchTeam = {
  season: number;
  eventCode: string;
  matchId: number;
  alliance: Alliance;
  allianceRole: AllianceRole;
  station: Station;
  teamNumber: number;
  team: Pick<FtcTeamProfile, "number" | "name">;
};

export type FtcMatchScoreAlliance = {
  alliance: Alliance;
  autoLeavePoints: number;
  autoLeave1: number;
  autoLeave2: number;
  autoArtifactPoints: number;
  autoArtifactClassifiedPoints: number;
  autoArtifactOverflowPoints: number;
  autoPatternPoints: number;
  autoClassifierState: Array<string | null>;
  dcBasePoints: number;
  dcBase1: number;
  dcBase2: number;
  dcBaseBonus: number;
  dcArtifactPoints: number;
  dcArtifactClassifiedPoints: number;
  dcArtifactOverflowPoints: number;
  dcPatternPoints: number;
  dcDepotPoints: number;
  dcClassifierState: Array<string | null>;
  movementRp: boolean;
  goalRp: boolean;
  patternRp: boolean;
  autoPoints: number;
  dcPoints: number;
  minorsCommitted: number;
  majorsCommitted: number;
  minorsByOpp: number;
  majorsByOpp: number;
  penaltyPointsCommitted: number;
  penaltyPointsByOpp: number;
  totalPointsNp: number;
  totalPoints: number;
};

export type FtcMatchScore2025 = {
  __typename?: "MatchScores2025";
  season: number;
  eventCode: string;
  matchId: number;
  red: FtcMatchScoreAlliance;
  blue: FtcMatchScoreAlliance;
};

export type FtcMatch = {
  season: number;
  eventCode: string;
  id: number;
  tournamentLevel: TournamentLevel;
  series: number;
  matchNum: number;
  description: string;
  hasBeenPlayed: boolean;
  scheduledStartTime?: string | null;
  actualStartTime?: string | null;
  postResultTime?: string | null;
  createdAt: string;
  updatedAt: string;
  teams: FtcMatchTeam[];
  scores?: FtcMatchScore2025 | null;
};

export type FtcAward = FtcTeamPageAward;

export type FtcEventTeamParticipation = {
  teamNumber: number;
  team: FtcTeamProfile;
};

export type FtcEventDetail = FtcConfiguredTeamEvent & {
  address?: string | null;
  regionCode?: string | null;
  leagueCode?: string | null;
  districtCode?: string | null;
  divisionCode?: string | null;
  remote: boolean;
  hybrid: boolean;
  fieldCount: number;
  published: boolean;
  hasMatches: boolean;
  website?: string | null;
  liveStreamURL?: string | null;
  webcasts: string[];
  createdAt: string;
  updatedAt: string;
  matches: FtcMatch[];
  awards: FtcAward[];
  teams: FtcEventTeamParticipation[];
};

export type FtcEventPageResult = FtcEventDetail | null;

function unmaskLocation(locationRef: unknown): FtcLocation {
  const location = getFragmentData(
    ClientLocationFieldsFragmentDoc,
    locationRef as never,
  );

  return {
    venue: location.venue ?? null,
    city: location.city,
    state: location.state,
    country: location.country,
  };
}

function unmaskQuickStat(statRef: unknown): FtcQuickStat {
  const stat = getFragmentData(
    ClientQuickStatFieldsFragmentDoc,
    statRef as never,
  );

  return {
    value: stat.value,
    rank: stat.rank,
  };
}

function unmaskQuickStats(statsRef: unknown): FtcQuickStats | null {
  if (!statsRef) {
    return null;
  }

  const stats = getFragmentData(
    ClientQuickStatsFieldsFragmentDoc,
    statsRef as never,
  );

  return {
    season: stats.season,
    number: stats.number,
    count: stats.count,
    tot: unmaskQuickStat(stats.tot),
    auto: unmaskQuickStat(stats.auto),
    dc: unmaskQuickStat(stats.dc),
    eg: unmaskQuickStat(stats.eg),
  };
}

function unmaskTeamProfile(teamRef: unknown): FtcTeamProfile {
  const team = getFragmentData(ClientTeamFieldsFragmentDoc, teamRef as never);

  return {
    number: team.number,
    name: team.name,
    schoolName: team.schoolName,
    rookieYear: team.rookieYear,
    website: team.website ?? null,
    location: unmaskLocation(team.location),
    quickStats: unmaskQuickStats(team.quickStats),
  };
}

function unmaskEvent(eventRef: unknown): FtcConfiguredTeamEvent {
  const event = getFragmentData(
    ClientEventListFieldsFragmentDoc,
    eventRef as never,
  );

  return {
    season: event.season,
    code: event.code,
    name: event.name,
    type: event.type,
    location: unmaskLocation(event.location),
    start: event.start,
    end: event.end,
    timezone: event.timezone,
    finished: event.finished,
    ongoing: event.ongoing,
    started: event.started,
  };
}

function unmaskAward(awardRef: unknown): FtcAward {
  const award = getFragmentData(ClientAwardFieldsFragmentDoc, awardRef as never);

  return {
    teamNumber: award.teamNumber,
    type: award.type,
    personName: award.personName ?? null,
    placement: award.placement,
    divisionName: award.divisionName ?? null,
  };
}

function unmaskMatchTeam(teamRef: unknown): FtcMatchTeam {
  const team = getFragmentData(
    ClientMatchTeamFieldsFragmentDoc,
    teamRef as never,
  );

  return {
    season: team.season,
    eventCode: team.eventCode,
    matchId: team.matchId,
    alliance: team.alliance,
    allianceRole: team.allianceRole,
    station: team.station,
    teamNumber: team.teamNumber,
    team: {
      number: team.team.number,
      name: team.team.name,
    },
  };
}

function unmaskMatchScoreAlliance(scoreRef: unknown): FtcMatchScoreAlliance {
  const score = getFragmentData(
    ClientMatchScoreAllianceFieldsFragmentDoc,
    scoreRef as never,
  );

  return {
    alliance: score.alliance,
    autoLeavePoints: score.autoLeavePoints,
    autoLeave1: score.autoLeave1,
    autoLeave2: score.autoLeave2,
    autoArtifactPoints: score.autoArtifactPoints,
    autoArtifactClassifiedPoints: score.autoArtifactClassifiedPoints,
    autoArtifactOverflowPoints: score.autoArtifactOverflowPoints,
    autoPatternPoints: score.autoPatternPoints,
    autoClassifierState: score.autoClassifierState,
    dcBasePoints: score.dcBasePoints,
    dcBase1: score.dcBase1,
    dcBase2: score.dcBase2,
    dcBaseBonus: score.dcBaseBonus,
    dcArtifactPoints: score.dcArtifactPoints,
    dcArtifactClassifiedPoints: score.dcArtifactClassifiedPoints,
    dcArtifactOverflowPoints: score.dcArtifactOverflowPoints,
    dcPatternPoints: score.dcPatternPoints,
    dcDepotPoints: score.dcDepotPoints,
    dcClassifierState: score.dcClassifierState,
    movementRp: score.movementRp,
    goalRp: score.goalRp,
    patternRp: score.patternRp,
    autoPoints: score.autoPoints,
    dcPoints: score.dcPoints,
    minorsCommitted: score.minorsCommitted,
    majorsCommitted: score.majorsCommitted,
    minorsByOpp: score.minorsByOpp,
    majorsByOpp: score.majorsByOpp,
    penaltyPointsCommitted: score.penaltyPointsCommitted,
    penaltyPointsByOpp: score.penaltyPointsByOpp,
    totalPointsNp: score.totalPointsNp,
    totalPoints: score.totalPoints,
  };
}

function unmaskMatch(matchRef: unknown): FtcMatch {
  const match = getFragmentData(ClientMatchFieldsFragmentDoc, matchRef as never);

  return {
    season: match.season,
    eventCode: match.eventCode,
    id: match.id,
    tournamentLevel: match.tournamentLevel,
    series: match.series,
    matchNum: match.matchNum,
    description: match.description,
    hasBeenPlayed: match.hasBeenPlayed,
    scheduledStartTime: match.scheduledStartTime ?? null,
    actualStartTime: match.actualStartTime ?? null,
    postResultTime: match.postResultTime ?? null,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    teams: match.teams.map(unmaskMatchTeam),
    scores:
      match.scores?.__typename === "MatchScores2025"
        ? {
            __typename: "MatchScores2025",
            season: match.scores.season,
            eventCode: match.scores.eventCode,
            matchId: match.scores.matchId,
            red: unmaskMatchScoreAlliance(match.scores.red),
            blue: unmaskMatchScoreAlliance(match.scores.blue),
          }
        : null,
  };
}

function unmaskEventDetail(eventRef: unknown): Omit<
  FtcEventDetail,
  "matches" | "awards" | "teams"
> {
  const detail = getFragmentData(
    ClientEventDetailFieldsFragmentDoc,
    eventRef as never,
  );
  const event = unmaskEvent(detail);

  return {
    ...event,
    address: detail.address ?? null,
    regionCode: detail.regionCode ?? null,
    leagueCode: detail.leagueCode ?? null,
    districtCode: detail.districtCode ?? null,
    divisionCode: detail.divisionCode ?? null,
    remote: detail.remote,
    hybrid: detail.hybrid,
    fieldCount: detail.fieldCount,
    published: detail.published,
    hasMatches: detail.hasMatches,
    website: detail.website ?? null,
    liveStreamURL: detail.liveStreamURL ?? null,
    webcasts: detail.webcasts,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  };
}

export function normalizeConfiguredTeamEventsResult(
  team: GetConfiguredTeamEventsQuery["teamByNumber"],
): FtcConfiguredTeamEventsResult {
  if (!team) {
    return null;
  }

  return {
    number: team.number,
    name: team.name,
    events: team.events.map((entry) => ({
      event: unmaskEvent(entry.event),
    })),
  };
}

export function normalizeTeamPageResult(
  team: GetTeamPageQuery["teamByNumber"],
): FtcTeamPageResult {
  if (!team) {
    return null;
  }

  const profile = unmaskTeamProfile(team);

  return {
    ...profile,
    events: team.events.map((entry) => ({
      awards: entry.awards.map(unmaskAward),
      event: unmaskEvent(entry.event),
    })),
  };
}

export function normalizeEventPageResult(
  event: GetEventPageQuery["eventByCode"],
): FtcEventPageResult {
  if (!event) {
    return null;
  }

  return {
    ...unmaskEventDetail(event),
    matches: event.matches.map(unmaskMatch),
    awards: event.awards.map(unmaskAward),
    teams: event.teams.map((entry) => ({
      teamNumber: entry.teamNumber,
      team: unmaskTeamProfile(entry.team),
    })),
  };
}
