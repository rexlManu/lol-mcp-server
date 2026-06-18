import { z } from "zod";
import { getRegional, getPlatform } from "../riot/client.js";
import { getRegionMapping } from "../riot/regions.js";
import type { RiotAccount, RiotSummoner, RiotLeagueEntry, RiotMatch } from "../riot/types.js";
import type { RiotChampionMastery } from "../riot/types-extra.js";
import { getCached, setCached, TTL } from "../cache/cache.js";
import { getAllChampions } from "../static-data/dataDragon.js";

const regionSchema = z
  .string()
  .default("euw")
  .describe("Region: euw, eune, na, kr, br, lan, las, oce, ru, tr, jp, ph2, sg2, th2, tw2, vn2");

const platformSchema = z
  .string()
  .default("euw1")
  .describe("Platform: euw1, eun1, na1, kr, jp1, br1, la1, la2, oc1, tr1, ru");

function platformToRegion(platform: string): string {
  const map: Record<string, string> = {
    euw1: "euw", eun1: "eune", na1: "na", kr: "kr", jp1: "jp",
    br1: "br", la1: "lan", la2: "las", oc1: "oce", tr1: "tr", ru: "ru",
  };
  return map[platform.toLowerCase()] ?? "euw";
}

export const getAccount = {
  name: "lol_get_account",
  description: "Get Riot account info by Riot ID (gameName#tagLine)",
  inputSchema: z.object({
    gameName: z.string().describe("Game name"),
    tagLine: z.string().describe("Tag line (e.g. EUW, KR1)"),
    region: regionSchema,
  }),
  handler: async (args: { gameName: string; tagLine: string; region: string }) => {
    const { gameName, tagLine, region } = args;
    const mapping = getRegionMapping(region);
    const cacheKey = `account:${region}:${gameName}:${tagLine}`;
    const cached = getCached<RiotAccount>(cacheKey);
    if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

    const account = await getRegional<RiotAccount>(
      mapping.regional,
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    );
    setCached(cacheKey, account, TTL.ACCOUNT);
    return { content: [{ type: "text" as const, text: JSON.stringify(account, null, 2) }] };
  },
};

export const getSummoner = {
  name: "lol_get_summoner",
  description: "Get summoner info (level, profile icon) by PUUID",
  inputSchema: z.object({
    puuid: z.string().describe("Player PUUID"),
    platform: platformSchema,
  }),
  handler: async (args: { puuid: string; platform: string }) => {
    const { puuid, platform } = args;
    const cacheKey = `summoner:${platform}:${puuid}`;
    const cached = getCached<RiotSummoner>(cacheKey);
    if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

    const summoner = await getPlatform<RiotSummoner>(
      platform.toLowerCase(),
      `/lol/summoner/v4/summoners/by-puuid/${puuid}`
    );
    setCached(cacheKey, summoner, TTL.SUMMONER);
    return { content: [{ type: "text" as const, text: JSON.stringify(summoner, null, 2) }] };
  },
};

export const getRanked = {
  name: "lol_get_ranked",
  description: "Get ranked stats (tier, rank, LP, wins, losses, winRate)",
  inputSchema: z.object({
    puuid: z.string().describe("Player PUUID"),
    platform: platformSchema,
  }),
  handler: async (args: { puuid: string; platform: string }) => {
    const { puuid, platform } = args;
    const cacheKey = `ranked:${platform}:${puuid}`;
    const cached = getCached<RiotLeagueEntry[]>(cacheKey);
    if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

    const entries = await getPlatform<RiotLeagueEntry[]>(
      platform.toLowerCase(),
      `/lol/league/v4/entries/by-puuid/${puuid}`
    );
    setCached(cacheKey, entries, TTL.RANKED);

    const formatted = entries.map((e) => ({
      queueType: e.queueType,
      tier: e.tier,
      rank: e.rank,
      lp: e.leaguePoints,
      wins: e.wins,
      losses: e.losses,
      winRate: e.wins + e.losses > 0 ? ((e.wins / (e.wins + e.losses)) * 100).toFixed(1) + "%" : "0%",
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(formatted, null, 2) }] };
  },
};

export const getPlayerProfile = {
  name: "lol_get_player_profile",
  description: "Get complete player profile in one call (account, summoner, ranked, mastery summary)",
  inputSchema: z.object({
    gameName: z.string().describe("Game name"),
    tagLine: z.string().describe("Tag line"),
    region: regionSchema,
    platform: platformSchema,
  }),
  handler: async (args: { gameName: string; tagLine: string; region: string; platform: string }) => {
    const { gameName, tagLine, region, platform } = args;
    const mapping = getRegionMapping(region);

    const account = await getRegional<RiotAccount>(
      mapping.regional,
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    );

    const summoner = await getPlatform<RiotSummoner>(
      platform.toLowerCase(),
      `/lol/summoner/v4/summoners/by-puuid/${account.puuid}`
    );

    let ranked: RiotLeagueEntry[] = [];
    try {
      ranked = await getPlatform<RiotLeagueEntry[]>(
        platform.toLowerCase(),
        `/lol/league/v4/entries/by-puuid/${account.puuid}`
      );
    } catch {
      // ranked data may not be available (unranked account, API error, etc.)
    }

    const masteries = await getPlatform<RiotChampionMastery[]>(
      platform.toLowerCase(),
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}/top?count=5`
    );

    const profile = {
      account: { puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine },
      summoner: {
        puuid: summoner.puuid,
        profileIconId: summoner.profileIconId,
        summonerLevel: summoner.summonerLevel,
      },
      ranked: ranked.map((e) => ({
        queueType: e.queueType,
        tier: e.tier,
        rank: e.rank,
        lp: e.leaguePoints,
        wins: e.wins,
        losses: e.losses,
        winRate: e.wins + e.losses > 0 ? ((e.wins / (e.wins + e.losses)) * 100).toFixed(1) + "%" : "0%",
      })),
      topMastery: masteries.map((m) => ({
        championId: m.championId,
        level: m.championLevel,
        points: m.championPoints,
        chestGranted: m.chestGranted,
      })),
    };
    return { content: [{ type: "text" as const, text: JSON.stringify(profile, null, 2) }] };
  },
};

export const getMatchHistory = {
  name: "lol_get_match_history",
  description: "Get recent match IDs",
  inputSchema: z.object({
    puuid: z.string().describe("Player PUUID"),
    region: regionSchema,
    count: z.number().min(1).max(100).default(20).describe("Number of matches (1-100)"),
    start: z.number().min(0).default(0).describe("Start index for pagination"),
    queue: z.number().optional().describe("Queue ID filter (420=Solo, 440=Flex, 450=ARAM)"),
    champion: z.number().optional().describe("Champion ID filter"),
    championId: z.number().optional().describe("Champion ID filter (alias for champion)"),
    championName: z.string().optional().describe("Champion name filter, e.g. Viktor"),
    startTime: z.number().optional().describe("Epoch timestamp start"),
    endTime: z.number().optional().describe("Epoch timestamp end"),
  }),
  handler: async (args: {
    puuid: string; region: string; count: number; start: number;
    queue?: number; champion?: number; championId?: number; championName?: string; startTime?: number; endTime?: number;
  }) => {
    const { puuid, region, count, start, queue, startTime, endTime } = args;
    const mapping = getRegionMapping(region);
    let champion = args.champion ?? args.championId;
    if (champion === undefined && args.championName) {
      const champions = await getAllChampions();
      const found = Object.values(champions).find((c) => c.name.toLowerCase() === args.championName!.toLowerCase() || c.id.toLowerCase() === args.championName!.toLowerCase());
      if (!found) throw new Error(`Champion "${args.championName}" not found`);
      champion = Number(found.key);
    }
    const requestCount = champion !== undefined ? Math.min(count * 5, 100) : count;
    const params = new URLSearchParams({ count: String(requestCount), start: String(start) });
    if (queue !== undefined) params.set("queue", String(queue));
    if (champion !== undefined) params.set("champion", String(champion));
    if (startTime !== undefined) params.set("startTime", String(startTime));
    if (endTime !== undefined) params.set("endTime", String(endTime));

    let matchIds = await getRegional<string[]>(
      mapping.regional,
      `/lol/match/v5/matches/by-puuid/${puuid}/ids?${params.toString()}`
    );

    if (champion !== undefined) {
      const verified: string[] = [];
      for (const matchId of matchIds) {
        const match = await getRegional<RiotMatch>(mapping.regional, `/lol/match/v5/matches/${matchId}`);
        const player = match.info.participants.find((p) => p.puuid === puuid);
        if (player?.championId === champion) verified.push(matchId);
      }
      matchIds = verified.slice(0, count);
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(matchIds, null, 2) }] };
  },
};

export const getMatchDetails = {
  name: "lol_get_match_details",
  description: "Get detailed info for one or more matches",
  inputSchema: z.object({
    matchIds: z.array(z.string()).describe("Match ID(s)"),
    region: regionSchema,
  }),
  handler: async (args: { matchIds: string[]; region: string }) => {
    const { matchIds, region } = args;
    const mapping = getRegionMapping(region);
    const results: RiotMatch[] = [];

    for (const matchId of matchIds) {
      const cacheKey = `match:${region}:${matchId}`;
      const cached = getCached<RiotMatch>(cacheKey);
      if (cached) { results.push(cached); continue; }

      const match = await getRegional<RiotMatch>(
        mapping.regional,
        `/lol/match/v5/matches/${matchId}`
      );
      setCached(cacheKey, match, TTL.MATCH_DETAILS);
      results.push(match);
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
  },
};

export const getMatchTimeline = {
  name: "lol_get_match_timeline",
  description: "Get minute-by-minute match timeline",
  inputSchema: z.object({
    matchId: z.string().describe("Match ID"),
    region: regionSchema,
  }),
  handler: async (args: { matchId: string; region: string }) => {
    const { matchId, region } = args;
    const mapping = getRegionMapping(region);
    const cacheKey = `timeline:${region}:${matchId}`;
    const cached = getCached(cacheKey);
    if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

    const timeline = await getRegional(
      mapping.regional,
      `/lol/match/v5/matches/${matchId}/timeline`
    );
    setCached(cacheKey, timeline, TTL.MATCH_TIMELINE);
    return { content: [{ type: "text" as const, text: JSON.stringify(timeline, null, 2) }] };
  },
};
