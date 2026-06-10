import { z } from "zod";
import { getPlatform } from "../riot/client.js";
import type { RiotChampionMastery, RiotChampionRotation, RiotFeaturedGames, RiotCurrentGame } from "../riot/types-extra.js";
import { getCached, setCached, TTL } from "../cache/cache.js";

const platformSchema = z
  .string()
  .default("euw1")
  .describe("Platform: euw1, eun1, na1, kr, jp1, br1, la1, la2, oc1, tr1, ru");

export const getChampionMastery = {
  name: "lol_get_champion_mastery",
  description: "Get champion mastery data (list or single champion)",
  inputSchema: z.object({
    puuid: z.string().describe("Player PUUID"),
    platform: platformSchema,
    championId: z.number().optional().describe("Specific champion ID (omit for top list)"),
  }),
  handler: async (args: { puuid: string; platform: string; championId?: number }) => {
    const { puuid, platform, championId } = args;
    const plat = platform.toLowerCase();

    if (championId !== undefined) {
      const mastery = await getPlatform<RiotChampionMastery>(
        plat,
        `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(mastery, null, 2) }] };
    }

    const cacheKey = `mastery:${plat}:${puuid}`;
    const cached = getCached<RiotChampionMastery[]>(cacheKey);
    if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

    const masteries = await getPlatform<RiotChampionMastery[]>(
      plat,
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`
    );
    setCached(cacheKey, masteries, TTL.MASTERY);
    return { content: [{ type: "text" as const, text: JSON.stringify(masteries, null, 2) }] };
  },
};

export const getLiveGame = {
  name: "lol_get_live_game",
  description: "Check if a player is currently in game",
  inputSchema: z.object({
    summonerId: z.string().describe("Summoner ID"),
    platform: platformSchema,
  }),
  handler: async (args: { summonerId: string; platform: string }) => {
    const { summonerId, platform } = args;
    try {
      const game = await getPlatform<RiotCurrentGame>(
        platform.toLowerCase(),
        `/lol/spectator/v5/active-games/by-summoner/${summonerId}`
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(game, null, 2) }] };
    } catch (err) {
      if ((err as Error).message.includes("404")) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ notInGame: true }, null, 2) }] };
      }
      throw err;
    }
  },
};

export const getChampionRotation = {
  name: "lol_get_champion_rotation",
  description: "Get current free champion rotation",
  inputSchema: z.object({
    platform: platformSchema,
  }),
  handler: async (args: { platform: string }) => {
    const { platform } = args;
    const cacheKey = `rotation:${platform.toLowerCase()}`;
    const cached = getCached<RiotChampionRotation>(cacheKey);
    if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

    const rotation = await getPlatform<RiotChampionRotation>(
      platform.toLowerCase(),
      `/lol/platform/v3/champion-rotations`
    );
    setCached(cacheKey, rotation, TTL.STATIC_DATA);
    return { content: [{ type: "text" as const, text: JSON.stringify(rotation, null, 2) }] };
  },
};

export const getFeaturedGames = {
  name: "lol_get_featured_games",
  description: "Get featured games",
  inputSchema: z.object({
    platform: platformSchema,
  }),
  handler: async (args: { platform: string }) => {
    const { platform } = args;
    const featured = await getPlatform<RiotFeaturedGames>(
      platform.toLowerCase(),
      `/lol/spectator/v5/featured-games`
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(featured, null, 2) }] };
  },
};
