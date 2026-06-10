import { z } from "zod";
import { scrapeBuildsForChampion } from "../lolalytics/scraper.js";
import { ScrapeLayoutChangedError } from "../lolalytics/parser.js";

export const getBuildsForChampion = {
  name: "lol_get_builds_for_champion",
  description: "Scrape Lolalytics for best builds, runes, counters, and meta data for a champion",
  inputSchema: z.object({
    champion: z.string().describe("Champion name (e.g. 'Ahri', 'Lee Sin')"),
    lane: z.string().optional().describe("Lane: top, jungle, mid, adc, support"),
    rank: z.string().optional().describe("Rank: iron, bronze, silver, gold, plat, diamond, master, grandmaster, challenger, all"),
    region: z.string().optional().describe("Region: world, na, euw, eune, kr, br, lan, las, oce, ru, tr, jp"),
    patch: z.string().optional().describe("Patch version (default: current)"),
  }),
  handler: async (args: { champion: string; lane?: string; rank?: string; region?: string; patch?: string }) => {
    try {
      const build = await scrapeBuildsForChampion(
        args.champion,
        args.lane,
        args.rank,
        args.region,
        args.patch
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(build, null, 2) }] };
    } catch (err) {
      if (err instanceof ScrapeLayoutChangedError) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "scrape_layout_changed",
              message: err.message,
              suggestion: "Lolalytics page structure changed. Parser needs update.",
            }, null, 2),
          }],
          isError: true,
        };
      }
      throw err;
    }
  },
};
