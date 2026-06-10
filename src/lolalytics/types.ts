export interface LolalyticsBuild {
  champion: string;
  lane?: string;
  rank?: string;
  region?: string;
  patch?: string;
  roles: { role: string; pickRate: number; winRate: number }[];
  runes: {
    primary: { tree: string; keystone: string; slots: string[] };
    secondary: { tree: string; slots: string[] };
    shards: string[];
    winRate: number;
    pickRate: number;
  }[];
  startingItems: { items: string[]; winRate: number; pickRate: number }[];
  boots: { items: string[]; winRate: number; pickRate: number }[];
  coreItems: { items: string[]; winRate: number; pickRate: number }[];
  situationalItems: { item: string; winRate: number; pickRate: number }[];
  skillOrder: {
    maxOrder: string;
    winRate: number;
    pickRate: number;
  }[];
  summonerSpells: { spells: string[]; winRate: number; pickRate: number }[];
  counters: { champion: string; winRate: number; pickRate: number }[];
  synergies: { champion: string; winRate: number; pickRate: number }[];
  overallWinRate: number;
  overallPickRate: number;
  overallBanRate: number;
}
