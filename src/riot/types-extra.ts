export interface RiotChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  summonerId: string;
}

export interface RiotChampionRotation {
  freeChampionIds: number[];
  freeChampionIdsForNewPlayers: number[];
  maxNewPlayerLevel: number;
}

export interface RiotFeaturedGame {
  gameMode: string;
  gameLength: number;
  mapId: number;
  gameType: string;
  bannedChampions: { championId: number; teamId: number; pickTurn: number }[];
  gameQueueConfigId: number;
  observers: { encryptionKey: string };
  participants: {
    championId: number;
    profileIconId: number;
    riotId: string;
    summonerName: string;
    bot: boolean;
    teamId: number;
    spell1Id: number;
    spell2Id: number;
  }[];
  platformId: string;
  gameId: number;
  gameStartTime: number;
}

export interface RiotFeaturedGames {
  gameList: RiotFeaturedGame[];
  clientRefreshInterval: number;
}

export interface RiotCurrentGame {
  gameMode: string;
  gameLength: number;
  mapId: number;
  gameType: string;
  bannedChampions: { championId: number; teamId: number; pickTurn: number }[];
  gameQueueConfigId: number;
  observers: { encryptionKey: string };
  participants: {
    championId: number;
    profileIconId: number;
    riotId: string;
    summonerName: string;
    bot: boolean;
    teamId: number;
    spell1Id: number;
    spell2Id: number;
  }[];
  platformId: string;
  gameId: number;
  gameStartTime: number;
}

export interface RiotLeagueList {
  leagueId: string;
  tier: string;
  name: string;
  queue: string;
  entries: {
    summonerId: string;
    summonerName: string;
    leaguePoints: number;
    rank: string;
    wins: number;
    losses: number;
    veteran: boolean;
    inactive: boolean;
    freshBlood: boolean;
    hotStreak: boolean;
  }[];
}

export interface RiotClashTournament {
  id: number;
  themeId: number;
  nameKey: string;
  nameKeySecondary: string;
  schedule: { id: number; registeredTimestamp: number; cancelledTimestamp: number | null; startTime: number; cancelled: boolean }[];
}

export interface RiotClashPlayer {
  summonerId: string;
  teamId: string;
  position: string;
  role: string;
}

export interface RiotClashTeam {
  id: string;
  tournamentId: number;
  name: string;
  iconId: number;
  tier: number;
  captain: string;
  abbreviation: string;
  players: { summonerId: string; position: string; role: string }[];
}

export interface RiotChallenge {
  id: number;
  level: string;
  current: number;
  max: number;
  locale: Record<string, { name: string; description: string }>;
  percentile: number;
  createdAt: number;
  reached: { [level: string]: number };
}

export interface RiotPlayerChallenges {
  totalPoints: { current: number; level: string; max: number; percentile: number };
  categoryPoints: Record<string, { current: number; level: string; max: number; percentile: number }>;
  challenges: RiotChallenge[];
}

export interface RiotServerStatus {
  id: string;
  name: string;
  locales: string[];
  maintenances: { maintenance_id: string; titles: { locale: string; content: string }[]; updates: { id: number; author: string; publish: boolean; publish_locations: string[]; translations: { locale: string; content: string; updated_at: string }[]; created_at: string; updated_at: string }[]; platforms: string[] }[];
  incidents: { id: number; titles: { locale: string; content: string }[]; updates: { id: number; author: string; publish: boolean; publish_locations: string[]; translations: { locale: string; content: string; updated_at: string }[]; created_at: string; updated_at: string }[]; platforms: string[] }[];
}
