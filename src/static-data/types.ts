export interface DataDragonChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  tags: string[];
  info: { attack: number; defense: number; magic: number; difficulty: number };
  image: { full: string; sprite: string };
  stats: Record<string, number>;
}

export interface DataDragonChampionFull {
  id: string;
  key: string;
  name: string;
  title: string;
  tags: string[];
  info: { attack: number; defense: number; magic: number; difficulty: number };
  image: { full: string; sprite: string };
  stats: Record<string, number>;
  passive: { name: string; description: string; image: { full: string } };
  spells: {
    id: string;
    name: string;
    description: string;
    cooldown: number[];
    cost: number[];
    range: number[];
    maxrank: number;
    image: { full: string };
    resource: string;
  }[];
}

export interface DataDragonItem {
  name: string;
  description: string;
  plaintext: string;
  from: string[];
  into: string[];
  image: { full: string };
  gold: { base: number; purchasable: boolean; total: number; sell: number };
  tags: string[];
  maps: Record<string, boolean>;
  stats: Record<string, number>;
}

export interface DataDragonRuneTree {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: {
    runes: {
      id: number;
      key: string;
      icon: string;
      name: string;
      shortDesc: string;
      longDesc: string;
    }[];
  }[];
}

export interface DataDragonVersions {
  [key: string]: string;
}
