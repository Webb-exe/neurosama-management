/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: any; output: any; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: any; output: any; }
};

export enum Alliance {
  Blue = 'Blue',
  Red = 'Red',
  Solo = 'Solo'
}

export enum AllianceRole {
  Captain = 'Captain',
  FirstPick = 'FirstPick',
  SecondPick = 'SecondPick',
  Solo = 'Solo'
}

export enum ArtifactType {
  Green = 'Green',
  None = 'None',
  Purple = 'Purple'
}

export enum AutoNav2021 {
  CompletelyInStorage = 'CompletelyInStorage',
  CompletelyInWarehouse = 'CompletelyInWarehouse',
  InStorage = 'InStorage',
  InWarehouse = 'InWarehouse',
  None = 'None'
}

export enum AutoNav2022 {
  None = 'None',
  Signal = 'Signal',
  TeamSignal = 'TeamSignal',
  Terminal = 'Terminal'
}

export enum AutoSpecialScoring {
  NoProp = 'NoProp',
  None = 'None',
  TeamProp = 'TeamProp'
}

export type Award = {
  __typename?: 'Award';
  createdAt: Scalars['DateTime']['output'];
  divisionName?: Maybe<Scalars['String']['output']>;
  event: Event;
  eventCode: Scalars['String']['output'];
  personName?: Maybe<Scalars['String']['output']>;
  placement: Scalars['Int']['output'];
  season: Scalars['Int']['output'];
  team: Team;
  teamNumber: Scalars['Int']['output'];
  type: AwardType;
  updatedAt: Scalars['DateTime']['output'];
};

export enum AwardType {
  Compass = 'Compass',
  ConferenceFinalist = 'ConferenceFinalist',
  Connect = 'Connect',
  Control = 'Control',
  DeansListFinalist = 'DeansListFinalist',
  DeansListSemiFinalist = 'DeansListSemiFinalist',
  DeansListWinner = 'DeansListWinner',
  Design = 'Design',
  DivisionFinalist = 'DivisionFinalist',
  DivisionWinner = 'DivisionWinner',
  Finalist = 'Finalist',
  Innovate = 'Innovate',
  Inspire = 'Inspire',
  JudgesChoice = 'JudgesChoice',
  Motivate = 'Motivate',
  Promote = 'Promote',
  Reach = 'Reach',
  Sustain = 'Sustain',
  Think = 'Think',
  TopRanked = 'TopRanked',
  Winner = 'Winner'
}

export enum BarcodeElement2021 {
  Duck = 'Duck',
  Tse = 'TSE'
}

export type BestName = {
  __typename?: 'BestName';
  id: Scalars['Int']['output'];
  team1: Team;
  team2: Team;
};

export type ConeLayout = {
  __typename?: 'ConeLayout';
  blueFarTerminal: Scalars['Int']['output'];
  blueNearTerminal: Scalars['Int']['output'];
  junctions: Array<Array<Array<ConeType>>>;
  redFarTerminal: Scalars['Int']['output'];
  redNearTerminal: Scalars['Int']['output'];
};

export enum ConeType {
  BlueBeacon1 = 'BlueBeacon1',
  BlueBeacon2 = 'BlueBeacon2',
  BlueCone = 'BlueCone',
  RedBeacon1 = 'RedBeacon1',
  RedBeacon2 = 'RedBeacon2',
  RedCone = 'RedCone'
}

export enum EgNav2023 {
  Backstage = 'Backstage',
  None = 'None',
  Rigging = 'Rigging'
}

export enum EgPark2021 {
  CompletelyInWarehouse = 'CompletelyInWarehouse',
  InWarehouse = 'InWarehouse',
  None = 'None'
}

export type Event = {
  __typename?: 'Event';
  address?: Maybe<Scalars['String']['output']>;
  awards: Array<Award>;
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  districtCode?: Maybe<Scalars['String']['output']>;
  divisionCode?: Maybe<Scalars['String']['output']>;
  end: Scalars['Date']['output'];
  fieldCount: Scalars['Int']['output'];
  finished: Scalars['Boolean']['output'];
  hasMatches: Scalars['Boolean']['output'];
  hybrid: Scalars['Boolean']['output'];
  leagueCode?: Maybe<Scalars['String']['output']>;
  liveStreamURL?: Maybe<Scalars['String']['output']>;
  location: Location;
  matches: Array<Match>;
  name: Scalars['String']['output'];
  ongoing: Scalars['Boolean']['output'];
  published: Scalars['Boolean']['output'];
  regionCode?: Maybe<Scalars['String']['output']>;
  relatedEvents: Array<Event>;
  remote: Scalars['Boolean']['output'];
  season: Scalars['Int']['output'];
  start: Scalars['Date']['output'];
  started: Scalars['Boolean']['output'];
  teamMatches: Array<TeamMatchParticipation>;
  teams: Array<TeamEventParticipation>;
  timezone: Scalars['String']['output'];
  type: EventType;
  updatedAt: Scalars['DateTime']['output'];
  webcasts: Array<Scalars['String']['output']>;
  website?: Maybe<Scalars['String']['output']>;
};


export type EventTeamMatchesArgs = {
  teamNumber?: InputMaybe<Scalars['Int']['input']>;
};

export enum EventType {
  Championship = 'Championship',
  DemoExhibition = 'DemoExhibition',
  FirstChampionship = 'FIRSTChampionship',
  InnovationChallenge = 'InnovationChallenge',
  Kickoff = 'Kickoff',
  LeagueMeet = 'LeagueMeet',
  LeagueTournament = 'LeagueTournament',
  OffSeason = 'OffSeason',
  Other = 'Other',
  PracticeDay = 'PracticeDay',
  Premier = 'Premier',
  Qualifier = 'Qualifier',
  Scrimmage = 'Scrimmage',
  SuperQualifier = 'SuperQualifier',
  VolunteerSignup = 'VolunteerSignup',
  Workshop = 'Workshop'
}

export enum EventTypeOption {
  All = 'All',
  Championship = 'Championship',
  Competition = 'Competition',
  DemoExhibition = 'DemoExhibition',
  FirstChampionship = 'FIRSTChampionship',
  InnovationChallenge = 'InnovationChallenge',
  Kickoff = 'Kickoff',
  LeagueMeet = 'LeagueMeet',
  LeagueTournament = 'LeagueTournament',
  NonCompetition = 'NonCompetition',
  OffSeason = 'OffSeason',
  Official = 'Official',
  Other = 'Other',
  PracticeDay = 'PracticeDay',
  Premier = 'Premier',
  Qualifier = 'Qualifier',
  Scrimmage = 'Scrimmage',
  SuperQualifier = 'SuperQualifier',
  VolunteerSignup = 'VolunteerSignup',
  Workshop = 'Workshop'
}

export type Filter = {
  cond?: InputMaybe<FilterCond>;
  group?: InputMaybe<FilterGroup>;
};

export type FilterCond = {
  lhs: FilterValue;
  op: FilterOp;
  rhs: FilterValue;
};

export type FilterGroup = {
  children: Array<Filter>;
  ty: FilterGroupTy;
};

export enum FilterGroupTy {
  And = 'And',
  Or = 'Or'
}

export enum FilterOp {
  Eq = 'Eq',
  Gt = 'Gt',
  Gte = 'Gte',
  Lt = 'Lt',
  Lte = 'Lte',
  Neq = 'Neq'
}

export type FilterValue = {
  lit?: InputMaybe<Scalars['Int']['input']>;
  var?: InputMaybe<Scalars['String']['input']>;
};

export enum ItdPark {
  Ascent1 = 'Ascent1',
  Ascent2 = 'Ascent2',
  Ascent3 = 'Ascent3',
  None = 'None',
  ObservationZone = 'ObservationZone'
}

export type Location = {
  __typename?: 'Location';
  city: Scalars['String']['output'];
  country: Scalars['String']['output'];
  state: Scalars['String']['output'];
  venue?: Maybe<Scalars['String']['output']>;
};

export type Match = {
  __typename?: 'Match';
  actualStartTime?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  event: Event;
  eventCode: Scalars['String']['output'];
  hasBeenPlayed: Scalars['Boolean']['output'];
  id: Scalars['Int']['output'];
  matchNum: Scalars['Int']['output'];
  postResultTime?: Maybe<Scalars['DateTime']['output']>;
  scheduledStartTime?: Maybe<Scalars['DateTime']['output']>;
  scores?: Maybe<MatchScores>;
  season: Scalars['Int']['output'];
  series: Scalars['Int']['output'];
  teams: Array<TeamMatchParticipation>;
  tournamentLevel: TournamentLevel;
  updatedAt: Scalars['DateTime']['output'];
};

export type MatchRecordRow = {
  __typename?: 'MatchRecordRow';
  data: SpecificAlliance;
  filterRank: Scalars['Int']['output'];
  filterSkipRank: Scalars['Int']['output'];
  noFilterRank: Scalars['Int']['output'];
  noFilterSkipRank: Scalars['Int']['output'];
};

export type MatchRecords = {
  __typename?: 'MatchRecords';
  count: Scalars['Int']['output'];
  data: Array<MatchRecordRow>;
  offset: Scalars['Int']['output'];
};

export type MatchScores = MatchScores2019 | MatchScores2020Remote | MatchScores2020Trad | MatchScores2021Remote | MatchScores2021Trad | MatchScores2022 | MatchScores2023 | MatchScores2024 | MatchScores2025;

export type MatchScores2019 = {
  __typename?: 'MatchScores2019';
  blue: MatchScores2019Alliance;
  eventCode: Scalars['String']['output'];
  matchId: Scalars['Int']['output'];
  red: MatchScores2019Alliance;
  season: Scalars['Int']['output'];
};

export type MatchScores2019Alliance = {
  __typename?: 'MatchScores2019Alliance';
  alliance: Alliance;
  autoDelivered: Scalars['Int']['output'];
  autoDeliveryPoints: Scalars['Int']['output'];
  autoFirstReturnedSkystone: Scalars['Boolean']['output'];
  autoNav2019_1: Scalars['Boolean']['output'];
  autoNav2019_2: Scalars['Boolean']['output'];
  autoNavPoints: Scalars['Int']['output'];
  autoPlaced: Scalars['Int']['output'];
  autoPlacementPoints: Scalars['Int']['output'];
  autoPoints: Scalars['Int']['output'];
  autoRepositioningPoints: Scalars['Int']['output'];
  autoReturned: Scalars['Int']['output'];
  autoSkystonesDeliveredFirst: Scalars['Int']['output'];
  capLevel1: Scalars['Int']['output'];
  capLevel2: Scalars['Int']['output'];
  cappingPoints: Scalars['Int']['output'];
  dcDelivered: Scalars['Int']['output'];
  dcDeliveryPoints: Scalars['Int']['output'];
  dcPlaced: Scalars['Int']['output'];
  dcPlacementPoints: Scalars['Int']['output'];
  dcPoints: Scalars['Int']['output'];
  dcReturned: Scalars['Int']['output'];
  egFoundationMoved: Scalars['Boolean']['output'];
  egFoundationMovedPoints: Scalars['Int']['output'];
  egParkPoints: Scalars['Int']['output'];
  egParked1: Scalars['Boolean']['output'];
  egParked2: Scalars['Boolean']['output'];
  egPoints: Scalars['Int']['output'];
  eventCode: Scalars['String']['output'];
  majorsByOpp: Scalars['Int']['output'];
  majorsCommitted: Scalars['Int']['output'];
  matchId: Scalars['Int']['output'];
  minorsByOpp: Scalars['Int']['output'];
  minorsCommitted: Scalars['Int']['output'];
  penaltyPointsByOpp: Scalars['Int']['output'];
  penaltyPointsCommitted: Scalars['Int']['output'];
  repositioned: Scalars['Boolean']['output'];
  season: Scalars['Int']['output'];
  skyscraperBonusPoints: Scalars['Int']['output'];
  skyscraperHeight: Scalars['Int']['output'];
  totalPoints: Scalars['Int']['output'];
  totalPointsNp: Scalars['Int']['output'];
};

export type MatchScores2020Alliance = {
  __typename?: 'MatchScores2020Alliance';
  alliance: Alliance;
  autoNav2020_1: Scalars['Boolean']['output'];
  autoNav2020_2: Scalars['Boolean']['output'];
  autoNavPoints: Scalars['Int']['output'];
  autoPoints: Scalars['Int']['output'];
  autoPowershotPoints: Scalars['Int']['output'];
  autoPowershots: Scalars['Int']['output'];
  autoTowerHigh: Scalars['Int']['output'];
  autoTowerLow: Scalars['Int']['output'];
  autoTowerMid: Scalars['Int']['output'];
  autoTowerPoints: Scalars['Int']['output'];
  autoWobble1: Scalars['Boolean']['output'];
  autoWobble2: Scalars['Boolean']['output'];
  autoWobblePoints: Scalars['Int']['output'];
  dcPoints: Scalars['Int']['output'];
  dcTowerHigh: Scalars['Int']['output'];
  dcTowerLow: Scalars['Int']['output'];
  dcTowerMid: Scalars['Int']['output'];
  egPoints: Scalars['Int']['output'];
  egPowershotPoints: Scalars['Int']['output'];
  egPowershots: Scalars['Int']['output'];
  egWobblePoints: Scalars['Int']['output'];
  egWobbleRingPoints: Scalars['Int']['output'];
  egWobbleRings: Scalars['Int']['output'];
  eventCode: Scalars['String']['output'];
  majorsCommitted: Scalars['Int']['output'];
  matchId: Scalars['Int']['output'];
  minorsCommitted: Scalars['Int']['output'];
  penaltyPointsCommitted: Scalars['Int']['output'];
  season: Scalars['Int']['output'];
  totalPoints: Scalars['Int']['output'];
  totalPointsNp: Scalars['Int']['output'];
  wobbleEndPos1: WobbleEndPosition2020;
  wobbleEndPos2: WobbleEndPosition2020;
};

export type MatchScores2020Remote = {
  __typename?: 'MatchScores2020Remote';
  alliance: Alliance;
  autoNav2020: Scalars['Boolean']['output'];
  autoNavPoints: Scalars['Int']['output'];
  autoPoints: Scalars['Int']['output'];
  autoPowershotPoints: Scalars['Int']['output'];
  autoPowershots: Scalars['Int']['output'];
  autoTowerHigh: Scalars['Int']['output'];
  autoTowerLow: Scalars['Int']['output'];
  autoTowerMid: Scalars['Int']['output'];
  autoTowerPoints: Scalars['Int']['output'];
  autoWobble1: Scalars['Boolean']['output'];
  autoWobble2: Scalars['Boolean']['output'];
  autoWobblePoints: Scalars['Int']['output'];
  dcPoints: Scalars['Int']['output'];
  dcTowerHigh: Scalars['Int']['output'];
  dcTowerLow: Scalars['Int']['output'];
  dcTowerMid: Scalars['Int']['output'];
  egPoints: Scalars['Int']['output'];
  egPowershotPoints: Scalars['Int']['output'];
  egPowershots: Scalars['Int']['output'];
  egWobblePoints: Scalars['Int']['output'];
  egWobbleRingPoints: Scalars['Int']['output'];
  egWobbleRings: Scalars['Int']['output'];
  eventCode: Scalars['String']['output'];
  majorsCommitted: Scalars['Int']['output'];
  matchId: Scalars['Int']['output'];
  minorsCommitted: Scalars['Int']['output'];
  penaltyPointsCommitted: Scalars['Int']['output'];
  season: Scalars['Int']['output'];
  totalPoints: Scalars['Int']['output'];
  totalPointsNp: Scalars['Int']['output'];
  wobbleEndPos1: WobbleEndPosition2020;
  wobbleEndPos2: WobbleEndPosition2020;
};

export type MatchScores2020Trad = {
  __typename?: 'MatchScores2020Trad';
  blue: MatchScores2020Alliance;
  eventCode: Scalars['String']['output'];
  matchId: Scalars['Int']['output'];
  red: MatchScores2020Alliance;
  season: Scalars['Int']['output'];
};

export type MatchScores2021Alliance = {
  __typename?: 'MatchScores2021Alliance';
  alliance: Alliance;
  allianceBalanced: Scalars['Boolean']['output'];
  allianceBalancedPoints: Scalars['Int']['output'];
  autoBonus1: Scalars['Boolean']['output'];
  autoBonus2: Scalars['Boolean']['output'];
  autoBonusPoints: Scalars['Int']['output'];
  autoCarousel: Scalars['Boolean']['output'];
  autoCarouselPoints: Scalars['Int']['output'];
  autoFreight1: Scalars['Int']['output'];
  autoFreight2: Scalars['Int']['output'];
  autoFreight3: Scalars['Int']['output'];
  autoFreightPoints: Scalars['Int']['output'];
  autoNav2021_1: AutoNav2021;
  autoNav2021_2: AutoNav2021;
  autoNavPoints: Scalars['Int']['output'];
  autoPoints: Scalars['Int']['output'];
  autoStorageFreight: Scalars['Int']['output'];
  barcodeElement1: BarcodeElement2021;
  barcodeElement2: BarcodeElement2021;
  capped: Scalars['Int']['output'];
  cappingPoints: Scalars['Int']['output'];
  dcAllianceHubPoints: Scalars['Int']['output'];
  dcFreight1: Scalars['Int']['output'];
  dcFreight2: Scalars['Int']['output'];
  dcFreight3: Scalars['Int']['output'];
  dcPoints: Scalars['Int']['output'];
  dcSharedHubPoints: Scalars['Int']['output'];
  dcStorageFreight: Scalars['Int']['output'];
  dcStoragePoints: Scalars['Int']['output'];
  egDuckPoints: Scalars['Int']['output'];
  egDucks: Scalars['Int']['output'];
  egPark1: EgPark2021;
  egPark2: EgPark2021;
  egParkPoints: Scalars['Int']['output'];
  egPoints: Scalars['Int']['output'];
  eventCode: Scalars['String']['output'];
  majorsCommitted: Scalars['Int']['output'];
  matchId: Scalars['Int']['output'];
  minorsCommitted: Scalars['Int']['output'];
  penaltyPointsCommitted: Scalars['Int']['output'];
  season: Scalars['Int']['output'];
  sharedFreight: Scalars['Int']['output'];
  sharedUnbalanced: Scalars['Boolean']['output'];
  sharedUnbalancedPoints: Scalars['Int']['output'];
  totalPoints: Scalars['Int']['output'];
  totalPointsNp: Scalars['Int']['output'];
};

export type MatchScores2021Remote = {
  __typename?: 'MatchScores2021Remote';
  alliance: Alliance;
  allianceBalanced: Scalars['Boolean']['output'];
  allianceBalancedPoints: Scalars['Int']['output'];
  autoBonus: Scalars['Boolean']['output'];
  autoBonusPoints: Scalars['Int']['output'];
  autoCarousel: Scalars['Boolean']['output'];
  autoCarouselPoints: Scalars['Int']['output'];
  autoFreight1: Scalars['Int']['output'];
  autoFreight2: Scalars['Int']['output'];
  autoFreight3: Scalars['Int']['output'];
  autoFreightPoints: Scalars['Int']['output'];
  autoNav2021: AutoNav2021;
  autoNavPoints: Scalars['Int']['output'];
  autoPoints: Scalars['Int']['output'];
  autoStorageFreight: Scalars['Int']['output'];
  barcodeElement: BarcodeElement2021;
  capped: Scalars['Int']['output'];
  cappingPoints: Scalars['Int']['output'];
  dcAllianceHubPoints: Scalars['Int']['output'];
  dcFreight1: Scalars['Int']['output'];
  dcFreight2: Scalars['Int']['output'];
  dcFreight3: Scalars['Int']['output'];
  dcPoints: Scalars['Int']['output'];
  dcStorageFreight: Scalars['Int']['output'];
  dcStoragePoints: Scalars['Int']['output'];
  egDuckPoints: Scalars['Int']['output'];
  egDucks: Scalars['Int']['output'];
  egPark: EgPark2021;
  egParkPoints: Scalars['Int']['output'];
  egPoints: Scalars['Int']['output'];
  eventCode: Scalars['String']['output'];
  majorsCommitted: Scalars['Int']['output'];
  matchId: Scalars['Int']['output'];
  minorsCommitted: Scalars['Int']['output'];
  penaltyPointsCommitted: Scalars['Int']['output'];
  season: Scalars['Int']['output'];
  totalPoints: Scalars['Int']['output'];
  totalPointsNp: Scalars['Int']['output'];
};

export type MatchScores2021Trad = {
  __typename?: 'MatchScores2021Trad';
  blue: MatchScores2021Alliance;
  eventCode: Scalars['String']['output'];
  matchId: Scalars['Int']['output'];
  red: MatchScores2021Alliance;
  season: Scalars['Int']['output'];
};

export type MatchScores2022 = {
  __typename?: 'MatchScores2022';
  autoConeLayout: ConeLayout;
  blue: MatchScores2022Alliance;
  dcConeLayout: ConeLayout;
  eventCode: Scalars['String']['output'];
  matchId: Scalars['Int']['output'];
  red: MatchScores2022Alliance;
  season: Scalars['Int']['output'];
};

export type MatchScores2022Alliance = {
  __typename?: 'MatchScores2022Alliance';
  alliance: Alliance;
  autoConePoints: Scalars['Int']['output'];
  autoGroundCones: Scalars['Int']['output'];
  autoHighCones: Scalars['Int']['output'];
  autoLowCones: Scalars['Int']['output'];
  autoMediumCones: Scalars['Int']['output'];
  autoNav2022_1: AutoNav2022;
  autoNav2022_2: AutoNav2022;
  autoNavPoints: Scalars['Int']['output'];
  autoPoints: Scalars['Int']['output'];
  autoTerminalCones: Scalars['Int']['output'];
  beaconOwnedJunctions: Scalars['Int']['output'];
  circuit: Scalars['Boolean']['output'];
  circuitPoints: Scalars['Int']['output'];
  coneOwnedJunctions: Scalars['Int']['output'];
  dcFarTerminalCones: Scalars['Int']['output'];
  dcGroundCones: Scalars['Int']['output'];
  dcHighCones: Scalars['Int']['output'];
  dcLowCones: Scalars['Int']['output'];
  dcMediumCones: Scalars['Int']['output'];
  dcNearTerminalCones: Scalars['Int']['output'];
  dcPoints: Scalars['Int']['output'];
  dcTerminalCones: Scalars['Int']['output'];
  egNav1: Scalars['Boolean']['output'];
  egNav2: Scalars['Boolean']['output'];
  egNavPoints: Scalars['Int']['output'];
  egPoints: Scalars['Int']['output'];
  eventCode: Scalars['String']['output'];
  majorsByOpp: Scalars['Int']['output'];
  majorsCommitted: Scalars['Int']['output'];
  matchId: Scalars['Int']['output'];
  minorsByOpp: Scalars['Int']['output'];
  minorsCommitted: Scalars['Int']['output'];
  ownershipPoints: Scalars['Int']['output'];
  penaltyPointsByOpp: Scalars['Int']['output'];
  penaltyPointsCommitted: Scalars['Int']['output'];
  season: Scalars['Int']['output'];
  totalPoints: Scalars['Int']['output'];
  totalPointsNp: Scalars['Int']['output'];
};

export type MatchScores2023 = {
  __typename?: 'MatchScores2023';
  blue: MatchScores2023Alliance;
  eventCode: Scalars['String']['output'];
  matchId: Scalars['Int']['output'];
  red: MatchScores2023Alliance;
  season: Scalars['Int']['output'];
};

export type MatchScores2023Alliance = {
  __typename?: 'MatchScores2023Alliance';
  alliance: Alliance;
  autoBackdrop: Scalars['Int']['output'];
  autoBackstage: Scalars['Int']['output'];
  autoNav1: Scalars['Boolean']['output'];
  autoNav2: Scalars['Boolean']['output'];
  autoNavPoints: Scalars['Int']['output'];
  autoPixelPoints: Scalars['Int']['output'];
  autoPoints: Scalars['Int']['output'];
  dcBackdrop: Scalars['Int']['output'];
  dcBackstage: Scalars['Int']['output'];
  dcPoints: Scalars['Int']['output'];
  drone1: Scalars['Int']['output'];
  drone2: Scalars['Int']['output'];
  dronePoints: Scalars['Int']['output'];
  egNav2023_1: EgNav2023;
  egNav2023_2: EgNav2023;
  egNavPoints: Scalars['Int']['output'];
  egPoints: Scalars['Int']['output'];
  eventCode: Scalars['String']['output'];
  majorsByOpp: Scalars['Int']['output'];
  majorsCommitted: Scalars['Int']['output'];
  matchId: Scalars['Int']['output'];
  maxSetLine: Scalars['Int']['output'];
  minorsByOpp: Scalars['Int']['output'];
  minorsCommitted: Scalars['Int']['output'];
  mosaicPoints: Scalars['Int']['output'];
  mosaics: Scalars['Int']['output'];
  penaltyPointsByOpp: Scalars['Int']['output'];
  penaltyPointsCommitted: Scalars['Int']['output'];
  purple1: AutoSpecialScoring;
  purple2: AutoSpecialScoring;
  purplePoints: Scalars['Int']['output'];
  season: Scalars['Int']['output'];
  setLinePoints: Scalars['Int']['output'];
  totalPoints: Scalars['Int']['output'];
  totalPointsNp: Scalars['Int']['output'];
  yellow1: AutoSpecialScoring;
  yellow2: AutoSpecialScoring;
  yellowPoints: Scalars['Int']['output'];
};

export type MatchScores2024 = {
  __typename?: 'MatchScores2024';
  blue: MatchScores2024Alliance;
  eventCode: Scalars['String']['output'];
  matchId: Scalars['Int']['output'];
  red: MatchScores2024Alliance;
  season: Scalars['Int']['output'];
};

export type MatchScores2024Alliance = {
  __typename?: 'MatchScores2024Alliance';
  alliance: Alliance;
  autoPark1: ItdPark;
  autoPark2: ItdPark;
  autoParkPoints: Scalars['Int']['output'];
  autoPoints: Scalars['Int']['output'];
  autoSampleHigh: Scalars['Int']['output'];
  autoSampleLow: Scalars['Int']['output'];
  autoSampleNet: Scalars['Int']['output'];
  autoSamplePoints: Scalars['Int']['output'];
  autoSpecimenHigh: Scalars['Int']['output'];
  autoSpecimenLow: Scalars['Int']['output'];
  autoSpecimenPoints: Scalars['Int']['output'];
  dcPark1: ItdPark;
  dcPark2: ItdPark;
  dcParkPoints: Scalars['Int']['output'];
  dcPoints: Scalars['Int']['output'];
  dcSampleHigh: Scalars['Int']['output'];
  dcSampleLow: Scalars['Int']['output'];
  dcSampleNet: Scalars['Int']['output'];
  dcSamplePoints: Scalars['Int']['output'];
  dcSpecimenHigh: Scalars['Int']['output'];
  dcSpecimenLow: Scalars['Int']['output'];
  dcSpecimenPoints: Scalars['Int']['output'];
  eventCode: Scalars['String']['output'];
  majorsByOpp: Scalars['Int']['output'];
  majorsCommitted: Scalars['Int']['output'];
  matchId: Scalars['Int']['output'];
  minorsByOpp: Scalars['Int']['output'];
  minorsCommitted: Scalars['Int']['output'];
  penaltyPointsByOpp: Scalars['Int']['output'];
  penaltyPointsCommitted: Scalars['Int']['output'];
  season: Scalars['Int']['output'];
  totalPoints: Scalars['Int']['output'];
  totalPointsNp: Scalars['Int']['output'];
};

export type MatchScores2025 = {
  __typename?: 'MatchScores2025';
  blue: MatchScores2025Alliance;
  eventCode: Scalars['String']['output'];
  matchId: Scalars['Int']['output'];
  red: MatchScores2025Alliance;
  season: Scalars['Int']['output'];
};

export type MatchScores2025Alliance = {
  __typename?: 'MatchScores2025Alliance';
  alliance: Alliance;
  autoArtifactClassifiedPoints: Scalars['Int']['output'];
  autoArtifactOverflowPoints: Scalars['Int']['output'];
  autoArtifactPoints: Scalars['Int']['output'];
  autoClassifierState: Array<Maybe<ArtifactType>>;
  autoLeave1: Scalars['Int']['output'];
  autoLeave2: Scalars['Int']['output'];
  autoLeavePoints: Scalars['Int']['output'];
  autoPatternPoints: Scalars['Int']['output'];
  autoPoints: Scalars['Int']['output'];
  dcArtifactClassifiedPoints: Scalars['Int']['output'];
  dcArtifactOverflowPoints: Scalars['Int']['output'];
  dcArtifactPoints: Scalars['Int']['output'];
  dcBase1: Scalars['Int']['output'];
  dcBase2: Scalars['Int']['output'];
  dcBaseBonus: Scalars['Int']['output'];
  dcBasePoints: Scalars['Int']['output'];
  dcClassifierState: Array<Maybe<ArtifactType>>;
  dcDepotPoints: Scalars['Int']['output'];
  dcPatternPoints: Scalars['Int']['output'];
  dcPoints: Scalars['Int']['output'];
  eventCode: Scalars['String']['output'];
  goalRp: Scalars['Boolean']['output'];
  majorsByOpp: Scalars['Int']['output'];
  majorsCommitted: Scalars['Int']['output'];
  matchId: Scalars['Int']['output'];
  minorsByOpp: Scalars['Int']['output'];
  minorsCommitted: Scalars['Int']['output'];
  movementRp: Scalars['Boolean']['output'];
  patternRp: Scalars['Boolean']['output'];
  penaltyPointsByOpp: Scalars['Int']['output'];
  penaltyPointsCommitted: Scalars['Int']['output'];
  season: Scalars['Int']['output'];
  totalPoints: Scalars['Int']['output'];
  totalPointsNp: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  voteBestName?: Maybe<BestName>;
};


export type MutationVoteBestNameArgs = {
  id: Scalars['Int']['input'];
  vote: Scalars['Int']['input'];
};

export type Query = {
  __typename?: 'Query';
  activeTeamsCount: Scalars['Int']['output'];
  eventByCode?: Maybe<Event>;
  eventsOnDate: Array<Event>;
  eventsSearch: Array<Event>;
  getBestName?: Maybe<BestName>;
  matchRecords: MatchRecords;
  matchesPlayedCount: Scalars['Int']['output'];
  teamByName?: Maybe<Team>;
  teamByNumber?: Maybe<Team>;
  teamsSearch: Array<Team>;
  tepRecords: TepRecords;
  tradWorldRecord: Match;
};


export type QueryActiveTeamsCountArgs = {
  season: Scalars['Int']['input'];
};


export type QueryEventByCodeArgs = {
  code: Scalars['String']['input'];
  season: Scalars['Int']['input'];
};


export type QueryEventsOnDateArgs = {
  date?: InputMaybe<Scalars['DateTime']['input']>;
  type?: InputMaybe<EventTypeOption>;
};


export type QueryEventsSearchArgs = {
  end?: InputMaybe<Scalars['Date']['input']>;
  hasMatches?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  region?: InputMaybe<RegionOption>;
  searchText?: InputMaybe<Scalars['String']['input']>;
  season: Scalars['Int']['input'];
  start?: InputMaybe<Scalars['Date']['input']>;
  type?: InputMaybe<EventTypeOption>;
};


export type QueryMatchRecordsArgs = {
  end?: InputMaybe<Scalars['Date']['input']>;
  filter?: InputMaybe<Filter>;
  region?: InputMaybe<RegionOption>;
  remote?: InputMaybe<RemoteOption>;
  season: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortDir?: InputMaybe<SortDir>;
  start?: InputMaybe<Scalars['Date']['input']>;
  take: Scalars['Int']['input'];
  type?: InputMaybe<EventTypeOption>;
};


export type QueryMatchesPlayedCountArgs = {
  season: Scalars['Int']['input'];
};


export type QueryTeamByNameArgs = {
  name: Scalars['String']['input'];
};


export type QueryTeamByNumberArgs = {
  number: Scalars['Int']['input'];
};


export type QueryTeamsSearchArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  region?: InputMaybe<RegionOption>;
  searchText?: InputMaybe<Scalars['String']['input']>;
};


export type QueryTepRecordsArgs = {
  end?: InputMaybe<Scalars['Date']['input']>;
  filter?: InputMaybe<Filter>;
  region?: InputMaybe<RegionOption>;
  remote?: InputMaybe<RemoteOption>;
  season: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortDir?: InputMaybe<SortDir>;
  start?: InputMaybe<Scalars['Date']['input']>;
  take: Scalars['Int']['input'];
  type?: InputMaybe<EventTypeOption>;
};


export type QueryTradWorldRecordArgs = {
  season: Scalars['Int']['input'];
};

export type QuickStat = {
  __typename?: 'QuickStat';
  rank: Scalars['Int']['output'];
  value: Scalars['Float']['output'];
};

export type QuickStats = {
  __typename?: 'QuickStats';
  auto: QuickStat;
  count: Scalars['Int']['output'];
  dc: QuickStat;
  eg: QuickStat;
  number: Scalars['Int']['output'];
  season: Scalars['Int']['output'];
  tot: QuickStat;
};

export enum RegionOption {
  Au = 'AU',
  All = 'All',
  Br = 'BR',
  Caab = 'CAAB',
  Cabc = 'CABC',
  Caon = 'CAON',
  Caqc = 'CAQC',
  Cmpic = 'CMPIC',
  Cmpz2 = 'CMPZ2',
  Cn = 'CN',
  Cy = 'CY',
  De = 'DE',
  Eg = 'EG',
  Es = 'ES',
  Fr = 'FR',
  Gb = 'GB',
  Il = 'IL',
  In = 'IN',
  International = 'International',
  Jm = 'JM',
  Kr = 'KR',
  Kz = 'KZ',
  Ly = 'LY',
  Mx = 'MX',
  Ng = 'NG',
  Nl = 'NL',
  Nz = 'NZ',
  Onadod = 'ONADOD',
  Qa = 'QA',
  Ro = 'RO',
  Ru = 'RU',
  Sa = 'SA',
  Th = 'TH',
  Tw = 'TW',
  Usak = 'USAK',
  Usal = 'USAL',
  Usar = 'USAR',
  Usarl = 'USARL',
  Usaz = 'USAZ',
  Usca = 'USCA',
  Uscala = 'USCALA',
  Uscals = 'USCALS',
  Uscano = 'USCANO',
  Uscasd = 'USCASD',
  Uschs = 'USCHS',
  Usco = 'USCO',
  Usct = 'USCT',
  Usde = 'USDE',
  Usfl = 'USFL',
  Usga = 'USGA',
  Ushi = 'USHI',
  Usia = 'USIA',
  Usid = 'USID',
  Usil = 'USIL',
  Usin = 'USIN',
  Usky = 'USKY',
  Usla = 'USLA',
  Usma = 'USMA',
  Usmd = 'USMD',
  Usmi = 'USMI',
  Usmn = 'USMN',
  Usmoks = 'USMOKS',
  Usms = 'USMS',
  Usmt = 'USMT',
  Usnc = 'USNC',
  Usnd = 'USND',
  Usne = 'USNE',
  Usnh = 'USNH',
  Usnj = 'USNJ',
  Usnm = 'USNM',
  Usnv = 'USNV',
  Usny = 'USNY',
  Usnyex = 'USNYEX',
  Usnyli = 'USNYLI',
  Usnyny = 'USNYNY',
  Usoh = 'USOH',
  Usok = 'USOK',
  Usor = 'USOR',
  Uspa = 'USPA',
  Usri = 'USRI',
  Ussc = 'USSC',
  Ustn = 'USTN',
  Ustx = 'USTX',
  Ustxce = 'USTXCE',
  Ustxho = 'USTXHO',
  Ustxno = 'USTXNO',
  Ustxso = 'USTXSO',
  Ustxwp = 'USTXWP',
  Usut = 'USUT',
  Usva = 'USVA',
  Usvt = 'USVT',
  Uswa = 'USWA',
  Uswi = 'USWI',
  Uswv = 'USWV',
  Uswy = 'USWY',
  UnitedStates = 'UnitedStates',
  Za = 'ZA'
}

export enum RemoteOption {
  All = 'All',
  Remote = 'Remote',
  Trad = 'Trad'
}

export enum SortDir {
  Asc = 'Asc',
  Desc = 'Desc'
}

export type SpecificAlliance = {
  __typename?: 'SpecificAlliance';
  alliance: Alliance;
  match: Match;
};

export enum Station {
  NotOnField = 'NotOnField',
  One = 'One',
  Solo = 'Solo',
  Two = 'Two'
}

export type Subscription = {
  __typename?: 'Subscription';
  newMatches?: Maybe<Array<Match>>;
};


export type SubscriptionNewMatchesArgs = {
  code: Scalars['String']['input'];
  season: Scalars['Int']['input'];
};

export type Team = {
  __typename?: 'Team';
  awards: Array<Award>;
  createdAt: Scalars['DateTime']['output'];
  events: Array<TeamEventParticipation>;
  location: Location;
  matches: Array<TeamMatchParticipation>;
  name: Scalars['String']['output'];
  number: Scalars['Int']['output'];
  quickStats?: Maybe<QuickStats>;
  rookieYear: Scalars['Int']['output'];
  schoolName: Scalars['String']['output'];
  sponsors: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  website?: Maybe<Scalars['String']['output']>;
};


export type TeamAwardsArgs = {
  season?: InputMaybe<Scalars['Int']['input']>;
};


export type TeamEventsArgs = {
  season: Scalars['Int']['input'];
};


export type TeamMatchesArgs = {
  eventCode?: InputMaybe<Scalars['String']['input']>;
  season?: InputMaybe<Scalars['Int']['input']>;
};


export type TeamQuickStatsArgs = {
  region?: InputMaybe<RegionOption>;
  season: Scalars['Int']['input'];
};

export type TeamEventParticipation = {
  __typename?: 'TeamEventParticipation';
  awards: Array<Award>;
  event: Event;
  eventCode: Scalars['String']['output'];
  matches: Array<TeamMatchParticipation>;
  season: Scalars['Int']['output'];
  stats?: Maybe<TeamEventStats>;
  team: Team;
  teamNumber: Scalars['Int']['output'];
};

export type TeamEventStats = TeamEventStats2019 | TeamEventStats2020Remote | TeamEventStats2020Trad | TeamEventStats2021Remote | TeamEventStats2021Trad | TeamEventStats2022 | TeamEventStats2023 | TeamEventStats2024 | TeamEventStats2025;

export type TeamEventStats2019 = {
  __typename?: 'TeamEventStats2019';
  avg: TeamEventStats2019Group;
  dev: TeamEventStats2019Group;
  dqs: Scalars['Int']['output'];
  losses: Scalars['Int']['output'];
  max: TeamEventStats2019Group;
  min: TeamEventStats2019Group;
  opr: TeamEventStats2019Group;
  qualMatchesPlayed: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
  rp: Scalars['Float']['output'];
  tb1: Scalars['Float']['output'];
  ties: Scalars['Int']['output'];
  tot: TeamEventStats2019Group;
  wins: Scalars['Int']['output'];
};

export type TeamEventStats2019Group = {
  __typename?: 'TeamEventStats2019Group';
  autoDeliveryPoints: Scalars['Float']['output'];
  autoNavPoints: Scalars['Float']['output'];
  autoNavPointsIndividual: Scalars['Float']['output'];
  autoPlacementPoints: Scalars['Float']['output'];
  autoPoints: Scalars['Float']['output'];
  autoRepositioningPoints: Scalars['Float']['output'];
  cappingPoints: Scalars['Float']['output'];
  cappingPointsIndividual: Scalars['Float']['output'];
  dcDeliveryPoints: Scalars['Float']['output'];
  dcPlacementPoints: Scalars['Float']['output'];
  dcPoints: Scalars['Float']['output'];
  egFoundationMovedPoints: Scalars['Float']['output'];
  egParkPoints: Scalars['Float']['output'];
  egParkPointsIndividual: Scalars['Float']['output'];
  egPoints: Scalars['Float']['output'];
  majorsByOppPoints: Scalars['Float']['output'];
  majorsCommittedPoints: Scalars['Float']['output'];
  minorsByOppPoints: Scalars['Float']['output'];
  minorsCommittedPoints: Scalars['Float']['output'];
  penaltyPointsByOpp: Scalars['Float']['output'];
  penaltyPointsCommitted: Scalars['Float']['output'];
  skyscraperBonusPoints: Scalars['Float']['output'];
  totalPoints: Scalars['Float']['output'];
  totalPointsNp: Scalars['Float']['output'];
};

export type TeamEventStats2020Remote = {
  __typename?: 'TeamEventStats2020Remote';
  avg: TeamEventStats2020RemoteGroup;
  dev: TeamEventStats2020RemoteGroup;
  max: TeamEventStats2020RemoteGroup;
  min: TeamEventStats2020RemoteGroup;
  opr: TeamEventStats2020RemoteGroup;
  qualMatchesPlayed: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
  rp: Scalars['Float']['output'];
  tb1: Scalars['Float']['output'];
  tb2: Scalars['Float']['output'];
  tot: TeamEventStats2020RemoteGroup;
};

export type TeamEventStats2020RemoteGroup = {
  __typename?: 'TeamEventStats2020RemoteGroup';
  autoNavPoints: Scalars['Float']['output'];
  autoNavPointsIndividual: Scalars['Float']['output'];
  autoPoints: Scalars['Float']['output'];
  autoPowershotPoints: Scalars['Float']['output'];
  autoTowerHighPoints: Scalars['Float']['output'];
  autoTowerLowPoints: Scalars['Float']['output'];
  autoTowerMidPoints: Scalars['Float']['output'];
  autoTowerPoints: Scalars['Float']['output'];
  autoWobblePoints: Scalars['Float']['output'];
  dcPoints: Scalars['Float']['output'];
  dcTowerHighPoints: Scalars['Float']['output'];
  dcTowerLowPoints: Scalars['Float']['output'];
  dcTowerMidPoints: Scalars['Float']['output'];
  egPoints: Scalars['Float']['output'];
  egPowershotPoints: Scalars['Float']['output'];
  egWobblePoints: Scalars['Float']['output'];
  egWobbleRingPoints: Scalars['Float']['output'];
  majorsCommittedPoints: Scalars['Float']['output'];
  minorsCommittedPoints: Scalars['Float']['output'];
  penaltyPointsCommitted: Scalars['Float']['output'];
  totalPoints: Scalars['Float']['output'];
  totalPointsNp: Scalars['Float']['output'];
};

export type TeamEventStats2020Trad = {
  __typename?: 'TeamEventStats2020Trad';
  avg: TeamEventStats2020TradGroup;
  dev: TeamEventStats2020TradGroup;
  dqs: Scalars['Int']['output'];
  losses: Scalars['Int']['output'];
  max: TeamEventStats2020TradGroup;
  min: TeamEventStats2020TradGroup;
  opr: TeamEventStats2020TradGroup;
  qualMatchesPlayed: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
  rp: Scalars['Float']['output'];
  tb1: Scalars['Float']['output'];
  tb2: Scalars['Float']['output'];
  ties: Scalars['Int']['output'];
  tot: TeamEventStats2020TradGroup;
  wins: Scalars['Int']['output'];
};

export type TeamEventStats2020TradGroup = {
  __typename?: 'TeamEventStats2020TradGroup';
  autoNavPoints: Scalars['Float']['output'];
  autoNavPointsIndividual: Scalars['Float']['output'];
  autoPoints: Scalars['Float']['output'];
  autoPowershotPoints: Scalars['Float']['output'];
  autoTowerHighPoints: Scalars['Float']['output'];
  autoTowerLowPoints: Scalars['Float']['output'];
  autoTowerMidPoints: Scalars['Float']['output'];
  autoTowerPoints: Scalars['Float']['output'];
  autoWobblePoints: Scalars['Float']['output'];
  dcPoints: Scalars['Float']['output'];
  dcTowerHighPoints: Scalars['Float']['output'];
  dcTowerLowPoints: Scalars['Float']['output'];
  dcTowerMidPoints: Scalars['Float']['output'];
  egPoints: Scalars['Float']['output'];
  egPowershotPoints: Scalars['Float']['output'];
  egWobblePoints: Scalars['Float']['output'];
  egWobbleRingPoints: Scalars['Float']['output'];
  majorsCommittedPoints: Scalars['Float']['output'];
  minorsCommittedPoints: Scalars['Float']['output'];
  penaltyPointsCommitted: Scalars['Float']['output'];
  totalPoints: Scalars['Float']['output'];
  totalPointsNp: Scalars['Float']['output'];
};

export type TeamEventStats2021Remote = {
  __typename?: 'TeamEventStats2021Remote';
  avg: TeamEventStats2021RemoteGroup;
  dev: TeamEventStats2021RemoteGroup;
  max: TeamEventStats2021RemoteGroup;
  min: TeamEventStats2021RemoteGroup;
  opr: TeamEventStats2021RemoteGroup;
  qualMatchesPlayed: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
  rp: Scalars['Float']['output'];
  tb1: Scalars['Float']['output'];
  tb2: Scalars['Float']['output'];
  tot: TeamEventStats2021RemoteGroup;
};

export type TeamEventStats2021RemoteGroup = {
  __typename?: 'TeamEventStats2021RemoteGroup';
  allianceBalancedPoints: Scalars['Float']['output'];
  autoBonusPoints: Scalars['Float']['output'];
  autoBonusPointsIndividual: Scalars['Float']['output'];
  autoCarouselPoints: Scalars['Float']['output'];
  autoFreight1Points: Scalars['Float']['output'];
  autoFreight2Points: Scalars['Float']['output'];
  autoFreight3Points: Scalars['Float']['output'];
  autoFreightPoints: Scalars['Float']['output'];
  autoFreightStoragePoints: Scalars['Float']['output'];
  autoNavPoints: Scalars['Float']['output'];
  autoNavPointsIndividual: Scalars['Float']['output'];
  autoPoints: Scalars['Float']['output'];
  cappingPoints: Scalars['Float']['output'];
  dcAllianceHubPoints: Scalars['Float']['output'];
  dcFreight1Points: Scalars['Float']['output'];
  dcFreight2Points: Scalars['Float']['output'];
  dcFreight3Points: Scalars['Float']['output'];
  dcPoints: Scalars['Float']['output'];
  dcStoragePoints: Scalars['Float']['output'];
  egDuckPoints: Scalars['Float']['output'];
  egParkPoints: Scalars['Float']['output'];
  egParkPointsIndividual: Scalars['Float']['output'];
  egPoints: Scalars['Float']['output'];
  majorsCommittedPoints: Scalars['Float']['output'];
  minorsCommittedPoints: Scalars['Float']['output'];
  penaltyPointsCommitted: Scalars['Float']['output'];
  totalPoints: Scalars['Float']['output'];
  totalPointsNp: Scalars['Float']['output'];
};

export type TeamEventStats2021Trad = {
  __typename?: 'TeamEventStats2021Trad';
  avg: TeamEventStats2021TradGroup;
  dev: TeamEventStats2021TradGroup;
  dqs: Scalars['Int']['output'];
  losses: Scalars['Int']['output'];
  max: TeamEventStats2021TradGroup;
  min: TeamEventStats2021TradGroup;
  opr: TeamEventStats2021TradGroup;
  qualMatchesPlayed: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
  rp: Scalars['Float']['output'];
  tb1: Scalars['Float']['output'];
  tb2: Scalars['Float']['output'];
  ties: Scalars['Int']['output'];
  tot: TeamEventStats2021TradGroup;
  wins: Scalars['Int']['output'];
};

export type TeamEventStats2021TradGroup = {
  __typename?: 'TeamEventStats2021TradGroup';
  allianceBalancedPoints: Scalars['Float']['output'];
  autoBonusPoints: Scalars['Float']['output'];
  autoBonusPointsIndividual: Scalars['Float']['output'];
  autoCarouselPoints: Scalars['Float']['output'];
  autoFreight1Points: Scalars['Float']['output'];
  autoFreight2Points: Scalars['Float']['output'];
  autoFreight3Points: Scalars['Float']['output'];
  autoFreightPoints: Scalars['Float']['output'];
  autoFreightStoragePoints: Scalars['Float']['output'];
  autoNavPoints: Scalars['Float']['output'];
  autoNavPointsIndividual: Scalars['Float']['output'];
  autoPoints: Scalars['Float']['output'];
  cappingPoints: Scalars['Float']['output'];
  dcAllianceHubPoints: Scalars['Float']['output'];
  dcFreight1Points: Scalars['Float']['output'];
  dcFreight2Points: Scalars['Float']['output'];
  dcFreight3Points: Scalars['Float']['output'];
  dcPoints: Scalars['Float']['output'];
  dcSharedHubPoints: Scalars['Float']['output'];
  dcStoragePoints: Scalars['Float']['output'];
  egDuckPoints: Scalars['Float']['output'];
  egParkPoints: Scalars['Float']['output'];
  egParkPointsIndividual: Scalars['Float']['output'];
  egPoints: Scalars['Float']['output'];
  majorsCommittedPoints: Scalars['Float']['output'];
  minorsCommittedPoints: Scalars['Float']['output'];
  penaltyPointsCommitted: Scalars['Float']['output'];
  sharedUnbalancedPoints: Scalars['Float']['output'];
  totalPoints: Scalars['Float']['output'];
  totalPointsNp: Scalars['Float']['output'];
};

export type TeamEventStats2022 = {
  __typename?: 'TeamEventStats2022';
  avg: TeamEventStats2022Group;
  dev: TeamEventStats2022Group;
  dqs: Scalars['Int']['output'];
  losses: Scalars['Int']['output'];
  max: TeamEventStats2022Group;
  min: TeamEventStats2022Group;
  opr: TeamEventStats2022Group;
  qualMatchesPlayed: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
  rp: Scalars['Float']['output'];
  tb1: Scalars['Float']['output'];
  tb2: Scalars['Float']['output'];
  ties: Scalars['Int']['output'];
  tot: TeamEventStats2022Group;
  wins: Scalars['Int']['output'];
};

export type TeamEventStats2022Group = {
  __typename?: 'TeamEventStats2022Group';
  autoConePoints: Scalars['Float']['output'];
  autoGroundPoints: Scalars['Float']['output'];
  autoHighPoints: Scalars['Float']['output'];
  autoLowPoints: Scalars['Float']['output'];
  autoMediumPoints: Scalars['Float']['output'];
  autoNavPoints: Scalars['Float']['output'];
  autoNavPointsIndividual: Scalars['Float']['output'];
  autoPoints: Scalars['Float']['output'];
  autoTerminalPoints: Scalars['Float']['output'];
  beaconOwnershipPoints: Scalars['Float']['output'];
  circuitPoints: Scalars['Float']['output'];
  coneOwnershipPoints: Scalars['Float']['output'];
  dcGroundPoints: Scalars['Float']['output'];
  dcHighPoints: Scalars['Float']['output'];
  dcLowPoints: Scalars['Float']['output'];
  dcMediumPoints: Scalars['Float']['output'];
  dcPoints: Scalars['Float']['output'];
  dcTerminalPoints: Scalars['Float']['output'];
  egNavPoints: Scalars['Float']['output'];
  egNavPointsIndividual: Scalars['Float']['output'];
  egPoints: Scalars['Float']['output'];
  majorsByOppPoints: Scalars['Float']['output'];
  majorsCommittedPoints: Scalars['Float']['output'];
  minorsByOppPoints: Scalars['Float']['output'];
  minorsCommittedPoints: Scalars['Float']['output'];
  ownershipPoints: Scalars['Float']['output'];
  penaltyPointsByOpp: Scalars['Float']['output'];
  penaltyPointsCommitted: Scalars['Float']['output'];
  totalPoints: Scalars['Float']['output'];
  totalPointsNp: Scalars['Float']['output'];
};

export type TeamEventStats2023 = {
  __typename?: 'TeamEventStats2023';
  avg: TeamEventStats2023Group;
  dev: TeamEventStats2023Group;
  dqs: Scalars['Int']['output'];
  losses: Scalars['Int']['output'];
  max: TeamEventStats2023Group;
  min: TeamEventStats2023Group;
  opr: TeamEventStats2023Group;
  qualMatchesPlayed: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
  rp: Scalars['Float']['output'];
  tb1: Scalars['Float']['output'];
  tb2: Scalars['Float']['output'];
  ties: Scalars['Int']['output'];
  tot: TeamEventStats2023Group;
  wins: Scalars['Int']['output'];
};

export type TeamEventStats2023Group = {
  __typename?: 'TeamEventStats2023Group';
  autoBackdropPoints: Scalars['Float']['output'];
  autoBackstagePoints: Scalars['Float']['output'];
  autoNavPoints: Scalars['Float']['output'];
  autoNavPointsIndividual: Scalars['Float']['output'];
  autoPixelPoints: Scalars['Float']['output'];
  autoPoints: Scalars['Float']['output'];
  dcBackdropPoints: Scalars['Float']['output'];
  dcBackstagePoints: Scalars['Float']['output'];
  dcPoints: Scalars['Float']['output'];
  dronePoints: Scalars['Float']['output'];
  dronePointsIndividual: Scalars['Float']['output'];
  egNavPoints: Scalars['Float']['output'];
  egNavPointsIndividual: Scalars['Float']['output'];
  egPoints: Scalars['Float']['output'];
  majorsByOppPoints: Scalars['Float']['output'];
  majorsCommittedPoints: Scalars['Float']['output'];
  minorsByOppPoints: Scalars['Float']['output'];
  minorsCommittedPoints: Scalars['Float']['output'];
  mosaicPoints: Scalars['Float']['output'];
  penaltyPointsByOpp: Scalars['Float']['output'];
  penaltyPointsCommitted: Scalars['Float']['output'];
  purplePoints: Scalars['Float']['output'];
  purplePointsIndividual: Scalars['Float']['output'];
  setLinePoints: Scalars['Float']['output'];
  totalPoints: Scalars['Float']['output'];
  totalPointsNp: Scalars['Float']['output'];
  yellowPoints: Scalars['Float']['output'];
  yellowPointsIndividual: Scalars['Float']['output'];
};

export type TeamEventStats2024 = {
  __typename?: 'TeamEventStats2024';
  avg: TeamEventStats2024Group;
  dev: TeamEventStats2024Group;
  dqs: Scalars['Int']['output'];
  losses: Scalars['Int']['output'];
  max: TeamEventStats2024Group;
  min: TeamEventStats2024Group;
  opr: TeamEventStats2024Group;
  qualMatchesPlayed: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
  rp: Scalars['Float']['output'];
  tb1: Scalars['Float']['output'];
  tb2: Scalars['Float']['output'];
  ties: Scalars['Int']['output'];
  tot: TeamEventStats2024Group;
  wins: Scalars['Int']['output'];
};

export type TeamEventStats2024Group = {
  __typename?: 'TeamEventStats2024Group';
  autoParkPoints: Scalars['Float']['output'];
  autoParkPointsIndividual: Scalars['Float']['output'];
  autoPoints: Scalars['Float']['output'];
  autoSampleHighPoints: Scalars['Float']['output'];
  autoSampleLowPoints: Scalars['Float']['output'];
  autoSampleNetPoints: Scalars['Float']['output'];
  autoSamplePoints: Scalars['Float']['output'];
  autoSpecimenHighPoints: Scalars['Float']['output'];
  autoSpecimenLowPoints: Scalars['Float']['output'];
  autoSpecimenPoints: Scalars['Float']['output'];
  dcParkPoints: Scalars['Float']['output'];
  dcParkPointsIndividual: Scalars['Float']['output'];
  dcPoints: Scalars['Float']['output'];
  dcSampleHighPoints: Scalars['Float']['output'];
  dcSampleLowPoints: Scalars['Float']['output'];
  dcSampleNetPoints: Scalars['Float']['output'];
  dcSamplePoints: Scalars['Float']['output'];
  dcSpecimenHighPoints: Scalars['Float']['output'];
  dcSpecimenLowPoints: Scalars['Float']['output'];
  dcSpecimenPoints: Scalars['Float']['output'];
  majorsByOppPoints: Scalars['Float']['output'];
  majorsCommittedPoints: Scalars['Float']['output'];
  minorsByOppPoints: Scalars['Float']['output'];
  minorsCommittedPoints: Scalars['Float']['output'];
  penaltyPointsByOpp: Scalars['Float']['output'];
  penaltyPointsCommitted: Scalars['Float']['output'];
  totalPoints: Scalars['Float']['output'];
  totalPointsNp: Scalars['Float']['output'];
};

export type TeamEventStats2025 = {
  __typename?: 'TeamEventStats2025';
  avg: TeamEventStats2025Group;
  dev: TeamEventStats2025Group;
  dqs: Scalars['Int']['output'];
  losses: Scalars['Int']['output'];
  max: TeamEventStats2025Group;
  min: TeamEventStats2025Group;
  opr: TeamEventStats2025Group;
  qualMatchesPlayed: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
  rp: Scalars['Float']['output'];
  tb1: Scalars['Float']['output'];
  tb2: Scalars['Float']['output'];
  ties: Scalars['Int']['output'];
  tot: TeamEventStats2025Group;
  wins: Scalars['Int']['output'];
};

export type TeamEventStats2025Group = {
  __typename?: 'TeamEventStats2025Group';
  autoArtifactClassifiedPoints: Scalars['Float']['output'];
  autoArtifactOverflowPoints: Scalars['Float']['output'];
  autoArtifactPoints: Scalars['Float']['output'];
  autoLeavePoints: Scalars['Float']['output'];
  autoLeavePointsIndividual: Scalars['Float']['output'];
  autoPatternPoints: Scalars['Float']['output'];
  autoPoints: Scalars['Float']['output'];
  dcArtifactClassifiedPoints: Scalars['Float']['output'];
  dcArtifactOverflowPoints: Scalars['Float']['output'];
  dcArtifactPoints: Scalars['Float']['output'];
  dcBaseBonus: Scalars['Float']['output'];
  dcBasePoints: Scalars['Float']['output'];
  dcBasePointsCombined: Scalars['Float']['output'];
  dcBasePointsIndividual: Scalars['Float']['output'];
  dcDepotPoints: Scalars['Float']['output'];
  dcPatternPoints: Scalars['Float']['output'];
  dcPoints: Scalars['Float']['output'];
  goalRp: Scalars['Float']['output'];
  majorsByOppPoints: Scalars['Float']['output'];
  majorsCommittedPoints: Scalars['Float']['output'];
  minorsByOppPoints: Scalars['Float']['output'];
  minorsCommittedPoints: Scalars['Float']['output'];
  movementRp: Scalars['Float']['output'];
  patternRp: Scalars['Float']['output'];
  penaltyPointsByOpp: Scalars['Float']['output'];
  penaltyPointsCommitted: Scalars['Float']['output'];
  totalPoints: Scalars['Float']['output'];
  totalPointsNp: Scalars['Float']['output'];
};

export type TeamMatchParticipation = {
  __typename?: 'TeamMatchParticipation';
  alliance: Alliance;
  allianceRole: AllianceRole;
  createdAt: Scalars['DateTime']['output'];
  dq: Scalars['Boolean']['output'];
  event: Event;
  eventCode: Scalars['String']['output'];
  match: Match;
  matchId: Scalars['Int']['output'];
  noShow: Scalars['Boolean']['output'];
  onField: Scalars['Boolean']['output'];
  season: Scalars['Int']['output'];
  station: Station;
  surrogate: Scalars['Boolean']['output'];
  team: Team;
  teamNumber: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TepRecordRow = {
  __typename?: 'TepRecordRow';
  data: TeamEventParticipation;
  filterRank: Scalars['Int']['output'];
  filterSkipRank: Scalars['Int']['output'];
  noFilterRank: Scalars['Int']['output'];
  noFilterSkipRank: Scalars['Int']['output'];
};

export type TepRecords = {
  __typename?: 'TepRecords';
  count: Scalars['Int']['output'];
  data: Array<TepRecordRow>;
  offset: Scalars['Int']['output'];
};

export enum TournamentLevel {
  DoubleElim = 'DoubleElim',
  Finals = 'Finals',
  Quals = 'Quals',
  Semis = 'Semis'
}

export enum WobbleEndPosition2020 {
  DropZone = 'DropZone',
  None = 'None',
  StartLine = 'StartLine'
}

export type GetConfiguredTeamEventsQueryVariables = Exact<{
  number: Scalars['Int']['input'];
  season?: Scalars['Int']['input'];
}>;


export type GetConfiguredTeamEventsQuery = { __typename?: 'Query', teamByNumber?: { __typename?: 'Team', number: number, name: string, events: Array<{ __typename?: 'TeamEventParticipation', event: (
        { __typename?: 'Event' }
        & { ' $fragmentRefs'?: { 'ClientEventListFieldsFragment': ClientEventListFieldsFragment } }
      ) }> } | null };

export type GetTeamPageQueryVariables = Exact<{
  number: Scalars['Int']['input'];
  season?: Scalars['Int']['input'];
}>;


export type GetTeamPageQuery = { __typename?: 'Query', teamByNumber?: (
    { __typename?: 'Team', events: Array<{ __typename?: 'TeamEventParticipation', awards: Array<(
        { __typename?: 'Award' }
        & { ' $fragmentRefs'?: { 'ClientAwardFieldsFragment': ClientAwardFieldsFragment } }
      )>, event: (
        { __typename?: 'Event' }
        & { ' $fragmentRefs'?: { 'ClientEventListFieldsFragment': ClientEventListFieldsFragment } }
      ) }> }
    & { ' $fragmentRefs'?: { 'ClientTeamFieldsFragment': ClientTeamFieldsFragment } }
  ) | null };

export type GetEventPageQueryVariables = Exact<{
  code: Scalars['String']['input'];
  season?: Scalars['Int']['input'];
}>;


export type GetEventPageQuery = { __typename?: 'Query', eventByCode?: (
    { __typename?: 'Event', matches: Array<(
      { __typename?: 'Match' }
      & { ' $fragmentRefs'?: { 'ClientMatchFieldsFragment': ClientMatchFieldsFragment } }
    )>, awards: Array<(
      { __typename?: 'Award' }
      & { ' $fragmentRefs'?: { 'ClientAwardFieldsFragment': ClientAwardFieldsFragment } }
    )>, teams: Array<{ __typename?: 'TeamEventParticipation', teamNumber: number, team: (
        { __typename?: 'Team' }
        & { ' $fragmentRefs'?: { 'ClientTeamFieldsFragment': ClientTeamFieldsFragment } }
      ) }> }
    & { ' $fragmentRefs'?: { 'ClientEventDetailFieldsFragment': ClientEventDetailFieldsFragment } }
  ) | null };

export type ClientLocationFieldsFragment = { __typename?: 'Location', venue?: string | null, city: string, state: string, country: string } & { ' $fragmentName'?: 'ClientLocationFieldsFragment' };

export type ClientQuickStatFieldsFragment = { __typename?: 'QuickStat', value: number, rank: number } & { ' $fragmentName'?: 'ClientQuickStatFieldsFragment' };

export type ClientQuickStatsFieldsFragment = { __typename?: 'QuickStats', season: number, number: number, count: number, tot: (
    { __typename?: 'QuickStat' }
    & { ' $fragmentRefs'?: { 'ClientQuickStatFieldsFragment': ClientQuickStatFieldsFragment } }
  ), auto: (
    { __typename?: 'QuickStat' }
    & { ' $fragmentRefs'?: { 'ClientQuickStatFieldsFragment': ClientQuickStatFieldsFragment } }
  ), dc: (
    { __typename?: 'QuickStat' }
    & { ' $fragmentRefs'?: { 'ClientQuickStatFieldsFragment': ClientQuickStatFieldsFragment } }
  ), eg: (
    { __typename?: 'QuickStat' }
    & { ' $fragmentRefs'?: { 'ClientQuickStatFieldsFragment': ClientQuickStatFieldsFragment } }
  ) } & { ' $fragmentName'?: 'ClientQuickStatsFieldsFragment' };

export type ClientTeamFieldsFragment = { __typename?: 'Team', number: number, name: string, schoolName: string, rookieYear: number, website?: string | null, location: (
    { __typename?: 'Location' }
    & { ' $fragmentRefs'?: { 'ClientLocationFieldsFragment': ClientLocationFieldsFragment } }
  ), quickStats?: (
    { __typename?: 'QuickStats' }
    & { ' $fragmentRefs'?: { 'ClientQuickStatsFieldsFragment': ClientQuickStatsFieldsFragment } }
  ) | null } & { ' $fragmentName'?: 'ClientTeamFieldsFragment' };

export type ClientEventListFieldsFragment = { __typename?: 'Event', season: number, code: string, name: string, type: EventType, start: any, end: any, timezone: string, finished: boolean, ongoing: boolean, started: boolean, location: (
    { __typename?: 'Location' }
    & { ' $fragmentRefs'?: { 'ClientLocationFieldsFragment': ClientLocationFieldsFragment } }
  ) } & { ' $fragmentName'?: 'ClientEventListFieldsFragment' };

export type ClientEventDetailFieldsFragment = (
  { __typename?: 'Event', address?: string | null, regionCode?: string | null, leagueCode?: string | null, districtCode?: string | null, divisionCode?: string | null, remote: boolean, hybrid: boolean, fieldCount: number, published: boolean, hasMatches: boolean, website?: string | null, liveStreamURL?: string | null, webcasts: Array<string>, createdAt: any, updatedAt: any }
  & { ' $fragmentRefs'?: { 'ClientEventListFieldsFragment': ClientEventListFieldsFragment } }
) & { ' $fragmentName'?: 'ClientEventDetailFieldsFragment' };

export type ClientAwardFieldsFragment = { __typename?: 'Award', teamNumber: number, type: AwardType, personName?: string | null, placement: number, divisionName?: string | null } & { ' $fragmentName'?: 'ClientAwardFieldsFragment' };

export type ClientMatchTeamFieldsFragment = { __typename?: 'TeamMatchParticipation', season: number, eventCode: string, matchId: number, alliance: Alliance, allianceRole: AllianceRole, station: Station, teamNumber: number, team: { __typename?: 'Team', number: number, name: string } } & { ' $fragmentName'?: 'ClientMatchTeamFieldsFragment' };

export type ClientMatchScoreAllianceFieldsFragment = { __typename?: 'MatchScores2025Alliance', alliance: Alliance, autoLeavePoints: number, autoLeave1: number, autoLeave2: number, autoArtifactPoints: number, autoArtifactClassifiedPoints: number, autoArtifactOverflowPoints: number, autoPatternPoints: number, autoClassifierState: Array<ArtifactType | null>, dcBasePoints: number, dcBase1: number, dcBase2: number, dcBaseBonus: number, dcArtifactPoints: number, dcArtifactClassifiedPoints: number, dcArtifactOverflowPoints: number, dcPatternPoints: number, dcDepotPoints: number, dcClassifierState: Array<ArtifactType | null>, movementRp: boolean, goalRp: boolean, patternRp: boolean, autoPoints: number, dcPoints: number, minorsCommitted: number, majorsCommitted: number, minorsByOpp: number, majorsByOpp: number, penaltyPointsCommitted: number, penaltyPointsByOpp: number, totalPointsNp: number, totalPoints: number } & { ' $fragmentName'?: 'ClientMatchScoreAllianceFieldsFragment' };

export type ClientMatchFieldsFragment = { __typename?: 'Match', season: number, eventCode: string, id: number, tournamentLevel: TournamentLevel, series: number, matchNum: number, description: string, hasBeenPlayed: boolean, scheduledStartTime?: any | null, actualStartTime?: any | null, postResultTime?: any | null, createdAt: any, updatedAt: any, teams: Array<(
    { __typename?: 'TeamMatchParticipation' }
    & { ' $fragmentRefs'?: { 'ClientMatchTeamFieldsFragment': ClientMatchTeamFieldsFragment } }
  )>, scores?:
    | { __typename?: 'MatchScores2019' }
    | { __typename?: 'MatchScores2020Remote' }
    | { __typename?: 'MatchScores2020Trad' }
    | { __typename?: 'MatchScores2021Remote' }
    | { __typename?: 'MatchScores2021Trad' }
    | { __typename?: 'MatchScores2022' }
    | { __typename?: 'MatchScores2023' }
    | { __typename?: 'MatchScores2024' }
    | { __typename?: 'MatchScores2025', season: number, eventCode: string, matchId: number, red: (
        { __typename?: 'MatchScores2025Alliance' }
        & { ' $fragmentRefs'?: { 'ClientMatchScoreAllianceFieldsFragment': ClientMatchScoreAllianceFieldsFragment } }
      ), blue: (
        { __typename?: 'MatchScores2025Alliance' }
        & { ' $fragmentRefs'?: { 'ClientMatchScoreAllianceFieldsFragment': ClientMatchScoreAllianceFieldsFragment } }
      ) }
   | null } & { ' $fragmentName'?: 'ClientMatchFieldsFragment' };

export const ClientLocationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientLocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]} as unknown as DocumentNode<ClientLocationFieldsFragment, unknown>;
export const ClientQuickStatFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientQuickStatFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuickStat"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"rank"}}]}}]} as unknown as DocumentNode<ClientQuickStatFieldsFragment, unknown>;
export const ClientQuickStatsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientQuickStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuickStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"tot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"auto"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dc"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"eg"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientQuickStatFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuickStat"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"rank"}}]}}]} as unknown as DocumentNode<ClientQuickStatsFieldsFragment, unknown>;
export const ClientTeamFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientTeamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Team"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"schoolName"}},{"kind":"Field","name":{"kind":"Name","value":"rookieYear"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientLocationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quickStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"season"},"value":{"kind":"IntValue","value":"2025"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatsFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientQuickStatFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuickStat"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"rank"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientLocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientQuickStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuickStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"tot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"auto"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dc"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"eg"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]} as unknown as DocumentNode<ClientTeamFieldsFragment, unknown>;
export const ClientEventListFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientEventListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientLocationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"ongoing"}},{"kind":"Field","name":{"kind":"Name","value":"started"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientLocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]} as unknown as DocumentNode<ClientEventListFieldsFragment, unknown>;
export const ClientEventDetailFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientEventDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientEventListFields"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"regionCode"}},{"kind":"Field","name":{"kind":"Name","value":"leagueCode"}},{"kind":"Field","name":{"kind":"Name","value":"districtCode"}},{"kind":"Field","name":{"kind":"Name","value":"divisionCode"}},{"kind":"Field","name":{"kind":"Name","value":"remote"}},{"kind":"Field","name":{"kind":"Name","value":"hybrid"}},{"kind":"Field","name":{"kind":"Name","value":"fieldCount"}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"hasMatches"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"liveStreamURL"}},{"kind":"Field","name":{"kind":"Name","value":"webcasts"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientLocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientEventListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientLocationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"ongoing"}},{"kind":"Field","name":{"kind":"Name","value":"started"}}]}}]} as unknown as DocumentNode<ClientEventDetailFieldsFragment, unknown>;
export const ClientAwardFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientAwardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Award"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamNumber"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"personName"}},{"kind":"Field","name":{"kind":"Name","value":"placement"}},{"kind":"Field","name":{"kind":"Name","value":"divisionName"}}]}}]} as unknown as DocumentNode<ClientAwardFieldsFragment, unknown>;
export const ClientMatchTeamFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientMatchTeamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeamMatchParticipation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"eventCode"}},{"kind":"Field","name":{"kind":"Name","value":"matchId"}},{"kind":"Field","name":{"kind":"Name","value":"alliance"}},{"kind":"Field","name":{"kind":"Name","value":"allianceRole"}},{"kind":"Field","name":{"kind":"Name","value":"station"}},{"kind":"Field","name":{"kind":"Name","value":"teamNumber"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ClientMatchTeamFieldsFragment, unknown>;
export const ClientMatchScoreAllianceFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientMatchScoreAllianceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MatchScores2025Alliance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alliance"}},{"kind":"Field","name":{"kind":"Name","value":"autoLeavePoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoLeave1"}},{"kind":"Field","name":{"kind":"Name","value":"autoLeave2"}},{"kind":"Field","name":{"kind":"Name","value":"autoArtifactPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoArtifactClassifiedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoArtifactOverflowPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoPatternPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoClassifierState"}},{"kind":"Field","name":{"kind":"Name","value":"dcBasePoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcBase1"}},{"kind":"Field","name":{"kind":"Name","value":"dcBase2"}},{"kind":"Field","name":{"kind":"Name","value":"dcBaseBonus"}},{"kind":"Field","name":{"kind":"Name","value":"dcArtifactPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcArtifactClassifiedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcArtifactOverflowPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcPatternPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcDepotPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcClassifierState"}},{"kind":"Field","name":{"kind":"Name","value":"movementRp"}},{"kind":"Field","name":{"kind":"Name","value":"goalRp"}},{"kind":"Field","name":{"kind":"Name","value":"patternRp"}},{"kind":"Field","name":{"kind":"Name","value":"autoPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcPoints"}},{"kind":"Field","name":{"kind":"Name","value":"minorsCommitted"}},{"kind":"Field","name":{"kind":"Name","value":"majorsCommitted"}},{"kind":"Field","name":{"kind":"Name","value":"minorsByOpp"}},{"kind":"Field","name":{"kind":"Name","value":"majorsByOpp"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyPointsCommitted"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyPointsByOpp"}},{"kind":"Field","name":{"kind":"Name","value":"totalPointsNp"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}}]}}]} as unknown as DocumentNode<ClientMatchScoreAllianceFieldsFragment, unknown>;
export const ClientMatchFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientMatchFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Match"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"eventCode"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tournamentLevel"}},{"kind":"Field","name":{"kind":"Name","value":"series"}},{"kind":"Field","name":{"kind":"Name","value":"matchNum"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hasBeenPlayed"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"actualStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"postResultTime"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientMatchTeamFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MatchScores2025"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"eventCode"}},{"kind":"Field","name":{"kind":"Name","value":"matchId"}},{"kind":"Field","name":{"kind":"Name","value":"red"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientMatchScoreAllianceFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"blue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientMatchScoreAllianceFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientMatchTeamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeamMatchParticipation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"eventCode"}},{"kind":"Field","name":{"kind":"Name","value":"matchId"}},{"kind":"Field","name":{"kind":"Name","value":"alliance"}},{"kind":"Field","name":{"kind":"Name","value":"allianceRole"}},{"kind":"Field","name":{"kind":"Name","value":"station"}},{"kind":"Field","name":{"kind":"Name","value":"teamNumber"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientMatchScoreAllianceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MatchScores2025Alliance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alliance"}},{"kind":"Field","name":{"kind":"Name","value":"autoLeavePoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoLeave1"}},{"kind":"Field","name":{"kind":"Name","value":"autoLeave2"}},{"kind":"Field","name":{"kind":"Name","value":"autoArtifactPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoArtifactClassifiedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoArtifactOverflowPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoPatternPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoClassifierState"}},{"kind":"Field","name":{"kind":"Name","value":"dcBasePoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcBase1"}},{"kind":"Field","name":{"kind":"Name","value":"dcBase2"}},{"kind":"Field","name":{"kind":"Name","value":"dcBaseBonus"}},{"kind":"Field","name":{"kind":"Name","value":"dcArtifactPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcArtifactClassifiedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcArtifactOverflowPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcPatternPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcDepotPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcClassifierState"}},{"kind":"Field","name":{"kind":"Name","value":"movementRp"}},{"kind":"Field","name":{"kind":"Name","value":"goalRp"}},{"kind":"Field","name":{"kind":"Name","value":"patternRp"}},{"kind":"Field","name":{"kind":"Name","value":"autoPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcPoints"}},{"kind":"Field","name":{"kind":"Name","value":"minorsCommitted"}},{"kind":"Field","name":{"kind":"Name","value":"majorsCommitted"}},{"kind":"Field","name":{"kind":"Name","value":"minorsByOpp"}},{"kind":"Field","name":{"kind":"Name","value":"majorsByOpp"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyPointsCommitted"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyPointsByOpp"}},{"kind":"Field","name":{"kind":"Name","value":"totalPointsNp"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}}]}}]} as unknown as DocumentNode<ClientMatchFieldsFragment, unknown>;
export const GetConfiguredTeamEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetConfiguredTeamEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"number"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"season"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"2025"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamByNumber"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"number"},"value":{"kind":"Variable","name":{"kind":"Name","value":"number"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"events"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"season"},"value":{"kind":"Variable","name":{"kind":"Name","value":"season"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientEventListFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientLocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientEventListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientLocationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"ongoing"}},{"kind":"Field","name":{"kind":"Name","value":"started"}}]}}]} as unknown as DocumentNode<GetConfiguredTeamEventsQuery, GetConfiguredTeamEventsQueryVariables>;
export const GetTeamPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeamPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"number"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"season"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"2025"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamByNumber"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"number"},"value":{"kind":"Variable","name":{"kind":"Name","value":"number"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientTeamFields"}},{"kind":"Field","name":{"kind":"Name","value":"events"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"season"},"value":{"kind":"Variable","name":{"kind":"Name","value":"season"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"awards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientAwardFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientEventListFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientLocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientQuickStatFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuickStat"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"rank"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientQuickStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuickStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"tot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"auto"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dc"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"eg"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientTeamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Team"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"schoolName"}},{"kind":"Field","name":{"kind":"Name","value":"rookieYear"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientLocationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quickStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"season"},"value":{"kind":"IntValue","value":"2025"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatsFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientAwardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Award"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamNumber"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"personName"}},{"kind":"Field","name":{"kind":"Name","value":"placement"}},{"kind":"Field","name":{"kind":"Name","value":"divisionName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientEventListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientLocationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"ongoing"}},{"kind":"Field","name":{"kind":"Name","value":"started"}}]}}]} as unknown as DocumentNode<GetTeamPageQuery, GetTeamPageQueryVariables>;
export const GetEventPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEventPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"season"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"2025"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"eventByCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"season"},"value":{"kind":"Variable","name":{"kind":"Name","value":"season"}}},{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientEventDetailFields"}},{"kind":"Field","name":{"kind":"Name","value":"matches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientMatchFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"awards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientAwardFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamNumber"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientTeamFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientLocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientEventListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientLocationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"ongoing"}},{"kind":"Field","name":{"kind":"Name","value":"started"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientMatchTeamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeamMatchParticipation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"eventCode"}},{"kind":"Field","name":{"kind":"Name","value":"matchId"}},{"kind":"Field","name":{"kind":"Name","value":"alliance"}},{"kind":"Field","name":{"kind":"Name","value":"allianceRole"}},{"kind":"Field","name":{"kind":"Name","value":"station"}},{"kind":"Field","name":{"kind":"Name","value":"teamNumber"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientMatchScoreAllianceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MatchScores2025Alliance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alliance"}},{"kind":"Field","name":{"kind":"Name","value":"autoLeavePoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoLeave1"}},{"kind":"Field","name":{"kind":"Name","value":"autoLeave2"}},{"kind":"Field","name":{"kind":"Name","value":"autoArtifactPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoArtifactClassifiedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoArtifactOverflowPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoPatternPoints"}},{"kind":"Field","name":{"kind":"Name","value":"autoClassifierState"}},{"kind":"Field","name":{"kind":"Name","value":"dcBasePoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcBase1"}},{"kind":"Field","name":{"kind":"Name","value":"dcBase2"}},{"kind":"Field","name":{"kind":"Name","value":"dcBaseBonus"}},{"kind":"Field","name":{"kind":"Name","value":"dcArtifactPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcArtifactClassifiedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcArtifactOverflowPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcPatternPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcDepotPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcClassifierState"}},{"kind":"Field","name":{"kind":"Name","value":"movementRp"}},{"kind":"Field","name":{"kind":"Name","value":"goalRp"}},{"kind":"Field","name":{"kind":"Name","value":"patternRp"}},{"kind":"Field","name":{"kind":"Name","value":"autoPoints"}},{"kind":"Field","name":{"kind":"Name","value":"dcPoints"}},{"kind":"Field","name":{"kind":"Name","value":"minorsCommitted"}},{"kind":"Field","name":{"kind":"Name","value":"majorsCommitted"}},{"kind":"Field","name":{"kind":"Name","value":"minorsByOpp"}},{"kind":"Field","name":{"kind":"Name","value":"majorsByOpp"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyPointsCommitted"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyPointsByOpp"}},{"kind":"Field","name":{"kind":"Name","value":"totalPointsNp"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientQuickStatFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuickStat"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"rank"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientQuickStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuickStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"tot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"auto"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dc"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"eg"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientEventDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientEventListFields"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"regionCode"}},{"kind":"Field","name":{"kind":"Name","value":"leagueCode"}},{"kind":"Field","name":{"kind":"Name","value":"districtCode"}},{"kind":"Field","name":{"kind":"Name","value":"divisionCode"}},{"kind":"Field","name":{"kind":"Name","value":"remote"}},{"kind":"Field","name":{"kind":"Name","value":"hybrid"}},{"kind":"Field","name":{"kind":"Name","value":"fieldCount"}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"hasMatches"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"liveStreamURL"}},{"kind":"Field","name":{"kind":"Name","value":"webcasts"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientMatchFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Match"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"eventCode"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tournamentLevel"}},{"kind":"Field","name":{"kind":"Name","value":"series"}},{"kind":"Field","name":{"kind":"Name","value":"matchNum"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hasBeenPlayed"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"actualStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"postResultTime"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientMatchTeamFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MatchScores2025"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"eventCode"}},{"kind":"Field","name":{"kind":"Name","value":"matchId"}},{"kind":"Field","name":{"kind":"Name","value":"red"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientMatchScoreAllianceFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"blue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientMatchScoreAllianceFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientAwardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Award"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamNumber"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"personName"}},{"kind":"Field","name":{"kind":"Name","value":"placement"}},{"kind":"Field","name":{"kind":"Name","value":"divisionName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientTeamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Team"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"schoolName"}},{"kind":"Field","name":{"kind":"Name","value":"rookieYear"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientLocationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quickStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"season"},"value":{"kind":"IntValue","value":"2025"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientQuickStatsFields"}}]}}]}}]} as unknown as DocumentNode<GetEventPageQuery, GetEventPageQueryVariables>;