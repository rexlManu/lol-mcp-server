import { z } from "zod";
import { getRegional, getPlatform } from "../riot/client.js";
import { getRegionMapping } from "../riot/regions.js";
import type { RiotAccount, RiotMatch } from "../riot/types.js";
import { analyzePerformance } from "../analysis/performance.js";
import { analyzeChampion } from "../analysis/championReview.js";
import { getImprovementTips } from "../analysis/trainingPlan.js";
import { comparePlayers } from "../analysis/compare.js";

const regionSchema = z.string().default("euw").describe("Region: euw, eune, na, kr, br, lan, las, oce, ru, tr, jp");
const platformSchema = z.string().default("euw1").describe("Platform: euw1, eun1, na1, kr, jp1, br1, la1, la2, oc1, tr1, ru");

async function getMatches(puuid: string, region: string, count: number, queue?: number, champion?: number): Promise<RiotMatch[]> {
  const mapping = getRegionMapping(region);
  const params = new URLSearchParams({ count: String(count), start: "0" });
  if (queue !== undefined) params.set("queue", String(queue));
  if (champion !== undefined) params.set("champion", String(champion));

  const matchIds = await getRegional<string[]>(
    mapping.regional,
    `/lol/match/v5/matches/by-puuid/${puuid}/ids?${params.toString()}`
  );

  const matches: RiotMatch[] = [];
  for (const id of matchIds) {
    const match = await getRegional<RiotMatch>(mapping.regional, `/lol/match/v5/matches/${id}`);
    matches.push(match);
  }
  return matches;
}

export const analyzePerformanceTool = {
  name: "lol_analyze_performance",
  description: "Analyze recent performance and give recommendations",
  inputSchema: z.object({
    puuid: z.string().describe("Player PUUID"),
    region: regionSchema,
    platform: platformSchema,
    matchCount: z.number().min(5).max(50).default(20).describe("Number of matches to analyze"),
    queue: z.number().optional().describe("Queue filter (420=Solo)"),
    champion: z.number().optional().describe("Champion ID filter"),
  }),
  handler: async (args: { puuid: string; region: string; platform: string; matchCount: number; queue?: number; champion?: number }) => {
    const matches = await getMatches(args.puuid, args.region, args.matchCount, args.queue, args.champion);
    const analysis = analyzePerformance(matches, args.puuid);
    return { content: [{ type: "text" as const, text: JSON.stringify(analysis, null, 2) }] };
  },
};

export const analyzeChampionTool = {
  name: "lol_analyze_champion",
  description: "Analyze performance on a specific champion",
  inputSchema: z.object({
    puuid: z.string().describe("Player PUUID"),
    champion: z.string().describe("Champion name"),
    region: regionSchema,
    platform: platformSchema,
    matchCount: z.number().min(5).max(50).default(20).describe("Number of matches to analyze"),
  }),
  handler: async (args: { puuid: string; champion: string; region: string; platform: string; matchCount: number }) => {
    const matches = await getMatches(args.puuid, args.region, args.matchCount);
    const analysis = analyzeChampion(matches, args.puuid, args.champion);
    return { content: [{ type: "text" as const, text: JSON.stringify(analysis, null, 2) }] };
  },
};

export const getImprovementTipsTool = {
  name: "lol_get_improvement_tips",
  description: "Get personalized improvement tips",
  inputSchema: z.object({
    puuid: z.string().describe("Player PUUID"),
    region: regionSchema,
    platform: platformSchema,
    matchCount: z.number().min(5).max(50).default(20).describe("Number of matches to analyze"),
    role: z.string().optional().describe("Role filter: TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY"),
    champion: z.string().optional().describe("Champion name filter"),
    goal: z.string().optional().describe("Specific improvement goal"),
  }),
  handler: async (args: { puuid: string; region: string; platform: string; matchCount: number; role?: string; champion?: string; goal?: string }) => {
    const matches = await getMatches(args.puuid, args.region, args.matchCount);
    const tips = getImprovementTips(matches, args.puuid, args.role, args.champion, args.goal);
    return { content: [{ type: "text" as const, text: JSON.stringify(tips, null, 2) }] };
  },
};

export const comparePlayersTool = {
  name: "lol_compare_players",
  description: "Compare stats between two players",
  inputSchema: z.object({
    gameNameA: z.string().describe("Player A game name"),
    tagLineA: z.string().describe("Player A tag line"),
    gameNameB: z.string().describe("Player B game name"),
    tagLineB: z.string().describe("Player B tag line"),
    region: regionSchema,
    platform: platformSchema,
    matchCount: z.number().min(5).max(50).default(20).describe("Number of matches per player"),
  }),
  handler: async (args: {
    gameNameA: string; tagLineA: string; gameNameB: string; tagLineB: string;
    region: string; platform: string; matchCount: number;
  }) => {
    const mapping = getRegionMapping(args.region);

    const [accountA, accountB] = await Promise.all([
      getRegional<RiotAccount>(mapping.regional, `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(args.gameNameA)}/${encodeURIComponent(args.tagLineA)}`),
      getRegional<RiotAccount>(mapping.regional, `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(args.gameNameB)}/${encodeURIComponent(args.tagLineB)}`),
    ]);

    const [matchesA, matchesB] = await Promise.all([
      getMatches(accountA.puuid, args.region, args.matchCount),
      getMatches(accountB.puuid, args.region, args.matchCount),
    ]);

    const comparison = comparePlayers(
      matchesA, matchesB,
      accountA.puuid, accountB.puuid,
      accountA.gameName, accountA.tagLine,
      accountB.gameName, accountB.tagLine
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(comparison, null, 2) }] };
  },
};
