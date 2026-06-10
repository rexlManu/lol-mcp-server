import * as cheerio from "cheerio";
import type { LolalyticsBuild } from "./types.js";

export class ScrapeLayoutChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScrapeLayoutChangedError";
  }
}

function parsePercent(text: string): number {
  const match = text.match(/([\d.]+)%/);
  return match ? parseFloat(match[1]) : 0;
}

export function parseLolalyticsChampionPage(
  html: string,
  champion: string,
  lane?: string,
  rank?: string,
  region?: string
): LolalyticsBuild {
  const $ = cheerio.load(html);

  const result: LolalyticsBuild = {
    champion,
    lane,
    rank,
    region,
    roles: [],
    runes: [],
    startingItems: [],
    boots: [],
    coreItems: [],
    situationalItems: [],
    skillOrder: [],
    summonerSpells: [],
    counters: [],
    synergies: [],
    overallWinRate: 0,
    overallPickRate: 0,
    overallBanRate: 0,
  };

  try {
    const bodyText = $("body").text();
    
    const wrMatch = bodyText.match(/([\d.]+)\s*%\s*Win Rate/);
    if (wrMatch) {
      result.overallWinRate = parseFloat(wrMatch[1]);
    }

    const prMatch = bodyText.match(/([\d.]+)\s*%\s*Pick Rate/);
    if (prMatch) {
      result.overallPickRate = parseFloat(prMatch[1]);
    }

    const brMatch = bodyText.match(/([\d.]+)\s*%\s*Ban Rate/);
    if (brMatch) {
      result.overallBanRate = parseFloat(brMatch[1]);
    }

    const laneMatch = bodyText.match(/(top|jungle|mid|bottom|support)\s+lane/i);
    if (laneMatch && !result.lane) {
      result.lane = laneMatch[1].toLowerCase();
    }

    if (result.lane) {
      result.roles.push({
        role: result.lane,
        pickRate: result.overallPickRate,
        winRate: result.overallWinRate,
      });
    }

    const runeImages: string[] = [];
    $("img[src*='rune68']").each((_, el) => {
      const alt = $(el).attr("alt");
      if (alt) runeImages.push(alt);
    });
    if (runeImages.length > 0) {
      result.runes.push({
        primary: {
          tree: runeImages[0] || "Unknown",
          keystone: runeImages[0] || "Unknown",
          slots: runeImages.slice(1, 4),
        },
        secondary: {
          tree: runeImages[4] || "",
          slots: runeImages.slice(5, 7),
        },
        shards: runeImages.slice(7, 10),
        winRate: result.overallWinRate,
        pickRate: result.overallPickRate,
      });
    }

    const spellImages: string[] = [];
    $("img[src*='spell64']").each((_, el) => {
      const alt = $(el).attr("alt");
      if (alt) spellImages.push(alt);
    });
    if (spellImages.length >= 2) {
      result.summonerSpells.push({
        spells: spellImages.slice(0, 2),
        winRate: result.overallWinRate,
        pickRate: result.overallPickRate,
      });
    }

    const itemImages: string[] = [];
    $("img[src*='item64']").each((_, el) => {
      const alt = $(el).attr("alt");
      if (alt) itemImages.push(alt);
    });
    if (itemImages.length > 0) {
      result.coreItems.push({
        items: itemImages.slice(0, 6),
        winRate: result.overallWinRate,
        pickRate: result.overallPickRate,
      });
    }

    const counterLinks: string[] = [];
    $("a[href*='/vs/']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const match = href.match(/\/vs\/([^/]+)\//);
      if (match) {
        const champName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        if (!counterLinks.includes(champName)) {
          counterLinks.push(champName);
        }
      }
    });
    result.counters = counterLinks.slice(0, 5).map((champ) => ({
      champion: champ,
      winRate: 0,
      pickRate: 0,
    }));

  } catch (err) {
    throw new ScrapeLayoutChangedError(
      `Lolalytics page layout changed for ${champion}: ${(err as Error).message}`
    );
  }

  return result;
}
