import { getCached, setCached, TTL } from "../cache/cache.js";
import { parseLolalyticsChampionPage } from "./parser.js";
import type { LolalyticsBuild } from "./types.js";

const LOLYTICS_BASE = "https://lolalytics.com";

const LANE_MAP: Record<string, string> = {
  top: "top",
  jungle: "jungle",
  mid: "mid",
  adc: "bottom",
  bot: "bottom",
  support: "support",
};

const RANK_MAP: Record<string, string> = {
  iron: "10",
  bronze: "20",
  silver: "30",
  gold: "40",
  plat: "50",
  platinum: "50",
  diamond: "60",
  master: "70",
  grandmaster: "80",
  challenger: "90",
  all: "10",
};

const REGION_MAP: Record<string, string> = {
  world: "world",
  na: "na",
  euw: "euw",
  eune: "eune",
  kr: "kr",
  br: "br",
  lan: "lan",
  las: "las",
  oce: "oce",
  ru: "ru",
  tr: "tr",
  jp: "jp",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export async function scrapeBuildsForChampion(
  champion: string,
  lane?: string,
  rank?: string,
  region?: string,
  patch?: string
): Promise<LolalyticsBuild> {
  const slug = slugify(champion);
  const laneSlug = lane ? LANE_MAP[lane.toLowerCase()] ?? lane.toLowerCase() : "bottom";
  const rankSlug = rank ? RANK_MAP[rank.toLowerCase()] ?? "10" : "10";
  const regionSlug = region ? REGION_MAP[region.toLowerCase()] ?? "world" : "world";

  const cacheKey = `lolalytics:${slug}:${laneSlug}:${rankSlug}:${regionSlug}`;
  const cached = getCached<LolalyticsBuild>(cacheKey);
  if (cached) return cached;

  const url = `${LOLYTICS_BASE}/lol/${slug}/build/?lane=${laneSlug}&region=${regionSlug}&tier=${rankSlug}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`Lolalytics fetch failed for ${champion}: ${res.status}`);
  }

  const html = await res.text();
  const build = parseLolalyticsChampionPage(html, champion, lane, rank, region);

  setCached(cacheKey, build, TTL.LOLYTICS);
  return build;
}
