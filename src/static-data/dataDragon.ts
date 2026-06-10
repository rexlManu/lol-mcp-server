import { getCached, setCached, TTL } from "../cache/cache.js";
import type {
  DataDragonChampion,
  DataDragonChampionFull,
  DataDragonItem,
  DataDragonRuneTree,
} from "./types.js";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";

async function getLatestVersion(): Promise<string> {
  const cached = getCached<string>("ddragon:version");
  if (cached) return cached;

  const res = await fetch(`${DDRAGON_BASE}/api/versions.json`);
  const versions: string[] = await res.json();
  const latest = versions[0];
  setCached("ddragon:version", latest, TTL.STATIC_DATA);
  return latest;
}

export async function getAllChampions(
  patch?: string
): Promise<Record<string, DataDragonChampion>> {
  const version = patch ?? (await getLatestVersion());
  const cacheKey = `ddragon:champions:${version}`;
  const cached = getCached<Record<string, DataDragonChampion>>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/champion.json`
  );
  const data = (await res.json()) as { data: Record<string, DataDragonChampion> };
  setCached(cacheKey, data.data, TTL.STATIC_DATA);
  return data.data;
}

export async function getChampionFull(
  champion: string,
  patch?: string
): Promise<DataDragonChampionFull> {
  const version = patch ?? (await getLatestVersion());
  const cacheKey = `ddragon:champion:${champion}:${version}`;
  const cached = getCached<DataDragonChampionFull>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/champion/${champion}.json`
  );
  const data = (await res.json()) as { data: Record<string, DataDragonChampionFull> };
  const champ = data.data[champion];
  if (!champ) throw new Error(`Champion "${champion}" not found`);
  setCached(cacheKey, champ, TTL.STATIC_DATA);
  return champ;
}

export async function getAllItems(
  patch?: string
): Promise<Record<string, DataDragonItem>> {
  const version = patch ?? (await getLatestVersion());
  const cacheKey = `ddragon:items:${version}`;
  const cached = getCached<Record<string, DataDragonItem>>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/item.json`
  );
  const data = (await res.json()) as { data: Record<string, DataDragonItem> };
  setCached(cacheKey, data.data, TTL.STATIC_DATA);
  return data.data;
}

export async function getRunesReforged(
  patch?: string
): Promise<DataDragonRuneTree[]> {
  const version = patch ?? (await getLatestVersion());
  const cacheKey = `ddragon:runes:${version}`;
  const cached = getCached<DataDragonRuneTree[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/runesReforged.json`
  );
  const data = (await res.json()) as DataDragonRuneTree[];
  setCached(cacheKey, data, TTL.STATIC_DATA);
  return data;
}
