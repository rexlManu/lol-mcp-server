import * as cheerio from "cheerio";
import { getCached, setCached, TTL } from "../cache/cache.js";

const WIKI_BASE = "https://leagueoflegends.fandom.com";

export interface WikiChampionInfo {
  name: string;
  title: string;
  roles: string[];
  range: string;
  resource: string;
  releaseDate: string;
  lore: string;
  abilities: {
    name: string;
    description: string;
    cooldown?: string;
    cost?: string;
  }[];
  stats: Record<string, string>;
}

export async function scrapeChampionWiki(
  champion: string
): Promise<WikiChampionInfo> {
  const slug = champion
    .split(/[\s']/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("_");
  const cacheKey = `wiki:champ:${slug}`;
  const cached = getCached<WikiChampionInfo>(cacheKey);
  if (cached) return cached;

  const url = `${WIKI_BASE}/wiki/${slug}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wiki fetch failed for ${champion}: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $(".page-header__title").first().text().trim() || champion;
  const subtitle = $(".page-header__tagline").first().text().trim() || "";

  const roles: string[] = [];
  $(".pi-data").each((_, el) => {
    const label = $(el).find(".pi-data-label").text().trim().toLowerCase();
    const value = $(el).find(".pi-data-value").text().trim();
    if (label.includes("role")) {
      roles.push(
        ...value
          .split("/")
          .map((r) => r.trim())
          .filter(Boolean)
      );
    }
  });

  const stats: Record<string, string> = {};
  $(".pi-data").each((_, el) => {
    const label = $(el).find(".pi-data-label").text().trim();
    const value = $(el).find(".pi-data-value").text().trim();
    if (label && value) stats[label] = value;
  });

  const abilities: WikiChampionInfo["abilities"] = [];
  $(".ability-info, .skill-info").each((_, el) => {
    const name = $(el).find(".ability-heading, .skill-heading").first().text().trim();
    const desc = $(el).find(".ability-text, .skill-text").first().text().trim();
    if (name || desc) {
      abilities.push({ name, description: desc });
    }
  });

  const lore = $(".quote-text").first().text().trim() || "";

  const info: WikiChampionInfo = {
    name: title,
    title: subtitle,
    roles,
    range: stats["Range"] ?? "",
    resource: stats["Resource"] ?? "",
    releaseDate: stats["Release Date"] ?? "",
    lore,
    abilities,
    stats,
  };

  setCached(cacheKey, info, TTL.STATIC_DATA);
  return info;
}
