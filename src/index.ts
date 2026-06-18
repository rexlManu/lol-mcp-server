#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  getAccount,
  getSummoner,
  getRanked,
  getPlayerProfile,
  getMatchHistory,
  getMatchDetails,
  getMatchTimeline,
} from "./tools/account.js";

import {
  getChampionMastery,
  getLiveGame,
  getChampionRotation,
  getFeaturedGames,
} from "./tools/champion.js";

import {
  getLeagueById,
  getLeagueEntries,
  getLeagueEntriesExp,
  getLeagueTop,
  getClashTournaments,
  getClashPlayer,
  getClashTeam,
  getChallenges,
  getPlayerChallenges,
  getServerStatus,
} from "./tools/league.js";

import {
  getAllChampionsTool,
  getChampInfo,
  getAllItemsTool,
  getRunesTool,
} from "./tools/staticData.js";

import { getBuildsForChampion } from "./tools/lolalytics.js";

import {
  analyzePerformanceTool,
  analyzeChampionTool,
  getImprovementTipsTool,
  comparePlayersTool,
} from "./tools/analysis.js";

import {
  getPlayerMatchSummary,
  getPlayerDeaths,
  getPlayerVisionSummary,
  getChampionReview,
  getTimelineEvents,
} from "./tools/review.js";

const server = new McpServer({
  name: "league-of-legends-mcp",
  version: "1.0.0",
});

const tools = [
  getAccount,
  getSummoner,
  getRanked,
  getPlayerProfile,
  getMatchHistory,
  getMatchDetails,
  getMatchTimeline,
  getChampionMastery,
  getLiveGame,
  getChampionRotation,
  getFeaturedGames,
  getLeagueById,
  getLeagueEntries,
  getLeagueEntriesExp,
  getLeagueTop,
  getClashTournaments,
  getClashPlayer,
  getClashTeam,
  getChallenges,
  getPlayerChallenges,
  getServerStatus,
  getAllChampionsTool,
  getChampInfo,
  getAllItemsTool,
  getRunesTool,
  getBuildsForChampion,
  analyzePerformanceTool,
  analyzeChampionTool,
  getImprovementTipsTool,
  comparePlayersTool,
  getPlayerMatchSummary,
  getPlayerDeaths,
  getPlayerVisionSummary,
  getChampionReview,
  getTimelineEvents,
];

for (const tool of tools) {
  server.registerTool(
    tool.name,
    {
      title: tool.name.replace(/_/g, " ").replace(/^lol /, "LoL "),
      description: tool.description,
      inputSchema: tool.inputSchema,
    },
    tool.handler
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`League of Legends MCP server running on stdio (${tools.length} tools)`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
