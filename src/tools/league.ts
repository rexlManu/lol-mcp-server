import { z } from "zod";
import { getPlatform, getRegional } from "../riot/client.js";
import { getRegionMapping } from "../riot/regions.js";
import type { RiotLeagueEntry } from "../riot/types.js";
import type { RiotLeagueList, RiotClashTournament, RiotClashPlayer, RiotClashTeam, RiotPlayerChallenges, RiotServerStatus } from "../riot/types-extra.js";
import { getCached, setCached, TTL } from "../cache/cache.js";

const platformSchema = z.string().default("euw1").describe("Platform: euw1, eun1, na1, kr, jp1, br1, la1, la2, oc1, tr1, ru");
const regionSchema = z.string().default("euw").describe("Region: euw, eune, na, kr, br, lan, las, oce, ru, tr, jp");

export const getLeagueById = {
  name: "lol_get_league_by_id",
  description: "Get league info by league ID",
  inputSchema: z.object({
    leagueId: z.string().describe("League ID"),
    platform: platformSchema,
  }),
  handler: async (args: { leagueId: string; platform: string }) => {
    const league = await getPlatform<RiotLeagueList>(
      args.platform.toLowerCase(),
      `/lol/league/v4/leagues/${args.leagueId}`
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(league, null, 2) }] };
  },
};

export const getLeagueEntries = {
  name: "lol_get_league_entries",
  description: "Get league entries by PUUID",
  inputSchema: z.object({
    puuid: z.string().describe("Player PUUID"),
    platform: platformSchema,
  }),
  handler: async (args: { puuid: string; platform: string }) => {
    const entries = await getPlatform<RiotLeagueEntry[]>(
      args.platform.toLowerCase(),
      `/lol/league/v4/entries/by-puuid/${args.puuid}`
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(entries, null, 2) }] };
  },
};

export const getLeagueEntriesExp = {
  name: "lol_get_league_entries_exp",
  description: "Get league entries by queue, tier, division (paginated)",
  inputSchema: z.object({
    queue: z.string().describe("Queue type: RANKED_SOLO_5x5, RANKED_FLEX_SR"),
    tier: z.string().describe("Tier: IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER"),
    division: z.string().describe("Division: I, II, III, IV"),
    platform: platformSchema,
    page: z.number().min(1).default(1).describe("Page number"),
  }),
  handler: async (args: { queue: string; tier: string; division: string; platform: string; page: number }) => {
    const entries = await getPlatform<RiotLeagueEntry[]>(
      args.platform.toLowerCase(),
      `/lol/league/v4/entries/${args.queue}/${args.tier}/${args.division}?page=${args.page}`
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(entries, null, 2) }] };
  },
};

export const getLeagueTop = {
  name: "lol_get_league_top",
  description: "Get top players in a league (challenger/grandmaster/master)",
  inputSchema: z.object({
    queue: z.string().describe("Queue: RANKED_SOLO_5x5, RANKED_FLEX_SR"),
    tier: z.string().describe("Tier: CHALLENGER, GRANDMASTER, MASTER"),
    platform: platformSchema,
  }),
  handler: async (args: { queue: string; tier: string; platform: string }) => {
    const league = await getPlatform<RiotLeagueList>(
      args.platform.toLowerCase(),
      `/lol/league/v4/${args.tier.toLowerCase()}?queue=${args.queue}`
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(league, null, 2) }] };
  },
};

export const getClashTournaments = {
  name: "lol_get_clash_tournaments",
  description: "Get active/upcoming Clash tournaments",
  inputSchema: z.object({
    platform: platformSchema,
  }),
  handler: async (args: { platform: string }) => {
    const tournaments = await getPlatform<RiotClashTournament[]>(
      args.platform.toLowerCase(),
      `/lol/clash/v1/tournaments`
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(tournaments, null, 2) }] };
  },
};

export const getClashPlayer = {
  name: "lol_get_clash_player",
  description: "Get Clash info for a player",
  inputSchema: z.object({
    puuid: z.string().describe("Player PUUID"),
    platform: platformSchema,
  }),
  handler: async (args: { puuid: string; platform: string }) => {
    const players = await getPlatform<RiotClashPlayer[]>(
      args.platform.toLowerCase(),
      `/lol/clash/v1/players/by-puuid/${args.puuid}`
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(players, null, 2) }] };
  },
};

export const getClashTeam = {
  name: "lol_get_clash_team",
  description: "Get Clash team info",
  inputSchema: z.object({
    teamId: z.string().describe("Clash team ID"),
    platform: platformSchema,
  }),
  handler: async (args: { teamId: string; platform: string }) => {
    const team = await getPlatform<RiotClashTeam>(
      args.platform.toLowerCase(),
      `/lol/clash/v1/teams/${args.teamId}`
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(team, null, 2) }] };
  },
};

export const getChallenges = {
  name: "lol_get_challenges",
  description: "Get all challenge configurations",
  inputSchema: z.object({
    platform: platformSchema,
  }),
  handler: async (args: { platform: string }) => {
    const cacheKey = `challenges:config:${args.platform.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

    const data = await getPlatform(
      args.platform.toLowerCase(),
      `/lol/challenges/v1/challenges/config`
    );
    setCached(cacheKey, data, TTL.CHALLENGES);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
};

export const getPlayerChallenges = {
  name: "lol_get_player_challenges",
  description: "Get player challenge progress",
  inputSchema: z.object({
    puuid: z.string().describe("Player PUUID"),
    platform: platformSchema,
  }),
  handler: async (args: { puuid: string; platform: string }) => {
    const data = await getPlatform<RiotPlayerChallenges>(
      args.platform.toLowerCase(),
      `/lol/challenges/v1/player-data/${args.puuid}`
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
};

export const getServerStatus = {
  name: "lol_get_server_status",
  description: "Get server status (maintenance/incidents) for a region",
  inputSchema: z.object({
    region: regionSchema,
  }),
  handler: async (args: { region: string }) => {
    const { region } = args;
    const mapping = getRegionMapping(region);
    const cacheKey = `status:${mapping.regional}`;
    const cached = getCached<RiotServerStatus>(cacheKey);
    if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

    const status = await getRegional<RiotServerStatus>(
      mapping.regional,
      `/lol/status/v3/platform-data`
    );
    setCached(cacheKey, status, TTL.SERVER_STATUS);
    return { content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }] };
  },
};
