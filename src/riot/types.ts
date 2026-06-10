export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  id?: string;
  accountId?: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotLeagueEntry {
  leagueId: string;
  summonerId: string;
  summonerName: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export interface RiotMatchParticipant {
  puuid: string;
  summonerName: string | null;
  riotIdGameName: string;
  riotIdTagline: string;
  championId: number;
  championName: string;
  teamId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  champLevel: number;
  goldEarned: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  totalHealsOnTeammates: number;
  totalDamageShieldedOnTeammates: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
  firstTowerKill: boolean;
  firstTowerAssist: boolean;
  dragonKills: number;
  baronKills: number;
  inhibitorKills: number;
  turretKills: number;
  role: string;
  lane: string;
  individualPosition: string;
  teamPosition: string;
}

export interface RiotMatchTeam {
  teamId: number;
  win: boolean;
  bans: { championId: number; pickTurn: number }[];
  objectives: Record<string, { first: boolean; kills: number }>;
}

export interface RiotMatchInfo {
  gameCreation: number;
  gameDuration: number;
  gameEndTimestamp: number;
  gameId: number;
  gameMode: string;
  gameName: string;
  gameStartTimestamp: number;
  gameType: string;
  gameVersion: string;
  mapId: number;
  participants: RiotMatchParticipant[];
  platformId: string;
  queueId: number;
  teams: RiotMatchTeam[];
}

export interface RiotMatch {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: RiotMatchInfo;
}

export interface RiotTimelineEvent {
  timestamp: number;
  type: string;
  [key: string]: unknown;
}

export interface RiotTimelineParticipantFrame {
  participantId: number;
  level: number;
  xp: number;
  gold: number;
  creepScore: number;
  jungleMinionsKilled: number;
  position: { x: number; y: number };
}

export interface RiotTimelineFrame {
  timestamp: number;
  events: RiotTimelineEvent[];
  participantFrames: Record<string, RiotTimelineParticipantFrame>;
}

export interface RiotTimeline {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    frameInterval: number;
    frames: RiotTimelineFrame[];
  };
}
