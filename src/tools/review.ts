import { z } from "zod";
import { getCached, setCached, TTL } from "../cache/cache.js";
import { getRegional } from "../riot/client.js";
import { getRegionMapping } from "../riot/regions.js";
import type { RiotAccount, RiotMatch, RiotMatchParticipant, RiotTimeline, RiotTimelineEvent } from "../riot/types.js";

const regionSchema = z.string().default("euw").describe("Region: euw, eune, na, kr, br, lan, las, oce, ru, tr, jp, ph2, sg2, th2, tw2, vn2");
const rankedSoloQueue = 420;

const queueNames: Record<number, string> = {
  400: "NORMAL_DRAFT",
  420: "RANKED_SOLO_5x5",
  430: "NORMAL_BLIND",
  440: "RANKED_FLEX_SR",
  450: "ARAM",
  700: "CLASH",
  900: "URF",
};

const trinkets: Record<number, string> = {
  3340: "Warding Totem",
  3363: "Farsight Alteration",
  3364: "Oracle Lens",
};

function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function formatTime(timestampMs: number): string {
  const totalSeconds = Math.floor(timestampMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function durationString(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function eventNumber(event: Record<string, unknown>, key: string): number | undefined {
  const value = event[key];
  return typeof value === "number" ? value : undefined;
}

function eventArray(event: Record<string, unknown>, key: string): number[] {
  const value = event[key];
  return Array.isArray(value) ? value.filter((v): v is number => typeof v === "number") : [];
}

function eventPosition(event: Record<string, unknown>): { x: number; y: number } | null {
  const value = event.position;
  if (!value || typeof value !== "object") return null;
  const pos = value as Record<string, unknown>;
  return typeof pos.x === "number" && typeof pos.y === "number" ? { x: pos.x, y: pos.y } : null;
}

function inferLaneOrZone(position: { x: number; y: number } | null): string {
  if (!position) return "unknown";
  const { x, y } = position;
  if (Math.abs(x - y) < 1800) return "mid_lane";
  if (x < 6500 && y > 8500) return "top_lane";
  if (x > 8500 && y < 6500) return "bot_lane";
  if (x < 6500 && y < 6500) return "blue_jungle";
  if (x > 8500 && y > 8500) return "red_jungle";
  return "river_or_jungle";
}

function phase(timestampMs: number): "laning" | "midgame" | "objectiveSetup" | "defensiveVision" {
  if (timestampMs < 14 * 60_000) return "laning";
  if (timestampMs < 25 * 60_000) return "midgame";
  return "objectiveSetup";
}

function participantName(p?: RiotMatchParticipant): string {
  if (!p) return "unknown";
  return p.riotIdGameName || p.summonerName || p.championName;
}

function getParticipantId(match: RiotMatch, participant: RiotMatchParticipant): number {
  if (typeof participant.participantId === "number") return participant.participantId;
  const index = match.info.participants.findIndex((p) => p.puuid === participant.puuid);
  return index + 1;
}

async function getAccount(gameName: string, tagLine: string, region: string): Promise<RiotAccount> {
  const mapping = getRegionMapping(region);
  return getRegional<RiotAccount>(
    mapping.regional,
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
}

async function getMatch(matchId: string, region: string): Promise<RiotMatch> {
  const cacheKey = `match:${region}:${matchId}`;
  const cached = getCached<RiotMatch>(cacheKey);
  if (cached) return cached;
  const mapping = getRegionMapping(region);
  const match = await getRegional<RiotMatch>(mapping.regional, `/lol/match/v5/matches/${matchId}`);
  setCached(cacheKey, match, TTL.MATCH_DETAILS);
  return match;
}

async function getTimeline(matchId: string, region: string): Promise<RiotTimeline> {
  const cacheKey = `timeline:${region}:${matchId}`;
  const cached = getCached<RiotTimeline>(cacheKey);
  if (cached) return cached;
  const mapping = getRegionMapping(region);
  const timeline = await getRegional<RiotTimeline>(mapping.regional, `/lol/match/v5/matches/${matchId}/timeline`);
  setCached(cacheKey, timeline, TTL.MATCH_TIMELINE);
  return timeline;
}

function findParticipant(match: RiotMatch, puuid: string): RiotMatchParticipant {
  const participant = match.info.participants.find((p) => p.puuid === puuid);
  if (!participant) throw new Error(`Player ${puuid} not found in match ${match.metadata.matchId}`);
  return participant;
}

function participantById(match: RiotMatch, participantId: number): RiotMatchParticipant | undefined {
  return match.info.participants.find((p) => getParticipantId(match, p) === participantId);
}

function participantFrameAt(timeline: RiotTimeline, participantId: number, timestampMs: number): Record<string, unknown> | null {
  let selected: Record<string, unknown> | null = null;
  for (const frame of timeline.info.frames) {
    if (frame.timestamp > timestampMs) break;
    selected = frame.participantFrames[String(participantId)] as unknown as Record<string, unknown>;
  }
  return selected;
}

function participantLevel(timeline: RiotTimeline, participantId: number, timestampMs: number): number | null {
  const frame = participantFrameAt(timeline, participantId, timestampMs);
  return typeof frame?.level === "number" ? frame.level : null;
}

function participantGold(timeline: RiotTimeline, participantId: number, timestampMs: number): number | null {
  const frame = participantFrameAt(timeline, participantId, timestampMs);
  const totalGold = frame?.totalGold;
  const gold = frame?.gold;
  if (typeof totalGold === "number") return totalGold;
  if (typeof gold === "number") return gold;
  return null;
}

function collectEvents(timeline: RiotTimeline): RiotTimelineEvent[] {
  return timeline.info.frames.flatMap((frame) => frame.events);
}

function teamKillsAt(match: RiotMatch, events: RiotTimelineEvent[], timestampMs: number): Record<number, number> {
  const kills: Record<number, number> = { 100: 0, 200: 0 };
  for (const event of events) {
    if (event.timestamp > timestampMs || event.type !== "CHAMPION_KILL") continue;
    const e = event as Record<string, unknown>;
    const killerId = eventNumber(e, "killerId");
    if (!killerId || killerId <= 0) continue;
    const killer = participantById(match, killerId);
    if (killer) kills[killer.teamId] = (kills[killer.teamId] ?? 0) + 1;
  }
  return kills;
}

function playerSummary(match: RiotMatch, player: RiotMatchParticipant) {
  const durationMinutes = match.info.gameDuration / 60;
  const team = match.info.participants.filter((p) => p.teamId === player.teamId);
  const teamKills = team.reduce((sum, p) => sum + p.kills, 0);
  const teamDamage = team.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0);
  const cs = player.totalMinionsKilled + player.neutralMinionsKilled;
  return {
    matchId: match.metadata.matchId,
    champion: player.championName,
    championId: player.championId,
    role: player.teamPosition || player.individualPosition || player.lane,
    queue: queueNames[match.info.queueId] ?? String(match.info.queueId),
    queueId: match.info.queueId,
    durationSeconds: match.info.gameDuration,
    win: player.win,
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    cs,
    csPerMinute: round(cs / durationMinutes),
    gold: player.goldEarned,
    goldPerMinute: round(player.goldEarned / durationMinutes),
    championDamage: player.totalDamageDealtToChampions,
    damageTaken: player.totalDamageTaken,
    visionScore: player.visionScore,
    wardsPlaced: player.wardsPlaced,
    controlWardsBought: player.visionWardsBoughtInGame ?? 0,
    controlWardsPlaced: player.detectorWardsPlaced ?? 0,
    wardsKilled: player.wardsKilled,
    killParticipation: teamKills > 0 ? round((player.kills + player.assists) / teamKills) : 0,
    teamDamageShare: teamDamage > 0 ? round(player.totalDamageDealtToChampions / teamDamage) : 0,
  };
}

export const getPlayerMatchSummary = {
  name: "lol_get_player_match_summary",
  description: "Get compact review stats for one player in one match without full match blob",
  inputSchema: z.object({
    matchId: z.string().describe("Match ID, e.g. EUW1_123"),
    gameName: z.string().describe("Riot ID game name"),
    tagLine: z.string().describe("Riot ID tag line"),
    region: regionSchema,
  }),
  handler: async (args: { matchId: string; gameName: string; tagLine: string; region: string }) => {
    const [account, match] = await Promise.all([getAccount(args.gameName, args.tagLine, args.region), getMatch(args.matchId, args.region)]);
    return text(playerSummary(match, findParticipant(match, account.puuid)));
  },
};

export const getPlayerDeaths = {
  name: "lol_get_player_deaths",
  description: "Get chronological death events for a player in a match with compact coaching context",
  inputSchema: z.object({
    matchId: z.string().describe("Match ID"),
    gameName: z.string().describe("Riot ID game name"),
    tagLine: z.string().describe("Riot ID tag line"),
    region: regionSchema,
  }),
  handler: async (args: { matchId: string; gameName: string; tagLine: string; region: string }) => {
    const [account, match, timeline] = await Promise.all([
      getAccount(args.gameName, args.tagLine, args.region),
      getMatch(args.matchId, args.region),
      getTimeline(args.matchId, args.region),
    ]);
    const player = findParticipant(match, account.puuid);
    const playerId = getParticipantId(match, player);
    const events = collectEvents(timeline);
    const deaths = events
      .filter((event) => event.type === "CHAMPION_KILL" && eventNumber(event as Record<string, unknown>, "victimId") === playerId)
      .map((event) => {
        const e = event as Record<string, unknown>;
        const killerId = eventNumber(e, "killerId");
        const assistIds = eventArray(e, "assistingParticipantIds");
        const position = eventPosition(e);
        const kills = teamKillsAt(match, events, event.timestamp);
        const playerGold = participantGold(timeline, playerId, event.timestamp);
        const killerGold = killerId ? participantGold(timeline, killerId, event.timestamp) : null;
        const laneOrZone = inferLaneOrZone(position);
        return {
          time: formatTime(event.timestamp),
          timestampMs: event.timestamp,
          killer: participantName(killerId ? participantById(match, killerId) : undefined),
          assistants: assistIds.map((id) => participantName(participantById(match, id))),
          position,
          laneOrZone,
          nearestObjective: "none",
          playerLevel: participantLevel(timeline, playerId, event.timestamp),
          killerLevel: killerId ? participantLevel(timeline, killerId, event.timestamp) : null,
          goldDiffAtDeath: playerGold !== null && killerGold !== null ? playerGold - killerGold : null,
          teamKillsAtDeath: `${kills[player.teamId] ?? 0}-${kills[player.teamId === 100 ? 200 : 100] ?? 0}`,
          tags: [laneOrZone.includes("lane") ? "lane_death" : "map_death"],
        };
      });
    return text(deaths);
  },
};

export const getPlayerVisionSummary = {
  name: "lol_get_player_vision_summary",
  description: "Get compact vision review data for a player in one match",
  inputSchema: z.object({
    matchId: z.string().describe("Match ID"),
    gameName: z.string().describe("Riot ID game name"),
    tagLine: z.string().describe("Riot ID tag line"),
    region: regionSchema,
  }),
  handler: async (args: { matchId: string; gameName: string; tagLine: string; region: string }) => {
    const [account, match, timeline] = await Promise.all([
      getAccount(args.gameName, args.tagLine, args.region),
      getMatch(args.matchId, args.region),
      getTimeline(args.matchId, args.region),
    ]);
    const player = findParticipant(match, account.puuid);
    const playerId = getParticipantId(match, player);
    const durationMinutes = match.info.gameDuration / 60;
    const wardEvents = collectEvents(timeline).filter((event) => {
      const e = event as Record<string, unknown>;
      return ["WARD_PLACED", "WARD_KILL"].includes(event.type) && eventNumber(e, "creatorId") === playerId || eventNumber(e, "killerId") === playerId;
    });
    const placed = wardEvents.filter((e) => e.type === "WARD_PLACED");
    const trinketPurchases = collectEvents(timeline).filter((event) => {
      const e = event as Record<string, unknown>;
      return event.type === "ITEM_PURCHASED" && eventNumber(e, "participantId") === playerId && trinkets[eventNumber(e, "itemId") ?? 0];
    });
    const grouped = { laning: 0, midgame: 0, objectiveSetup: 0, defensiveVision: 0 };
    for (const event of placed) grouped[phase(event.timestamp)] += 1;
    return text({
      visionScore: player.visionScore,
      visionScorePerMinute: round(player.visionScore / durationMinutes),
      wardsPlaced: player.wardsPlaced,
      controlWardsBought: player.visionWardsBoughtInGame ?? 0,
      controlWardsPlaced: player.detectorWardsPlaced ?? placed.filter((event) => (event as Record<string, unknown>).wardType === "CONTROL_WARD").length,
      wardsKilled: player.wardsKilled,
      trinketSwaps: trinketPurchases.map((event, index) => {
        const itemId = eventNumber(event as Record<string, unknown>, "itemId") ?? 0;
        return { time: formatTime(event.timestamp), from: index === 0 ? null : trinkets[eventNumber(trinketPurchases[index - 1] as Record<string, unknown>, "itemId") ?? 0], to: trinkets[itemId] };
      }),
      firstWardTime: placed[0] ? formatTime(placed[0].timestamp) : null,
      lastWardTime: placed.at(-1) ? formatTime(placed.at(-1)!.timestamp) : null,
      wardPositionsByPhase: grouped,
    });
  },
};

export const getChampionReview = {
  name: "lol_get_champion_review",
  description: "Get compact multi-match review for recent games on one champion",
  inputSchema: z.object({
    gameName: z.string().describe("Riot ID game name"),
    tagLine: z.string().describe("Riot ID tag line"),
    championName: z.string().describe("Champion name, e.g. Viktor"),
    championId: z.number().optional().describe("Optional champion ID"),
    queue: z.number().default(rankedSoloQueue).describe("Queue ID, default 420 ranked solo/duo"),
    limit: z.number().min(1).max(20).default(5).describe("Number of champion matches to return"),
    region: regionSchema,
  }),
  handler: async (args: { gameName: string; tagLine: string; championName: string; championId?: number; queue: number; limit: number; region: string }) => {
    const account = await getAccount(args.gameName, args.tagLine, args.region);
    const mapping = getRegionMapping(args.region);
    const params = new URLSearchParams({ count: String(Math.min(args.limit * 5, 100)), start: "0", queue: String(args.queue) });
    if (args.championId) params.set("champion", String(args.championId));
    const ids = await getRegional<string[]>(mapping.regional, `/lol/match/v5/matches/by-puuid/${account.puuid}/ids?${params.toString()}`);
    const matches = [];
    for (const id of ids) {
      const match = await getMatch(id, args.region);
      const player = findParticipant(match, account.puuid);
      if (player.championName.toLowerCase() !== args.championName.toLowerCase() && player.championId !== args.championId) continue;
      matches.push({ match, player });
      if (matches.length >= args.limit) break;
    }
    const summaries = matches.map(({ match, player }) => playerSummary(match, player));
    const games = summaries.length;
    const avg = (key: keyof (typeof summaries)[number]) => games ? round(summaries.reduce((sum, s) => sum + (typeof s[key] === "number" ? s[key] as number : 0), 0) / games) : 0;
    const wins = summaries.filter((s) => s.win).length;
    return text({
      champion: args.championName,
      games,
      record: `${wins}-${games - wins}`,
      averages: {
        kills: avg("kills"), deaths: avg("deaths"), assists: avg("assists"), csPerMinute: avg("csPerMinute"),
        goldPerMinute: avg("goldPerMinute"), damagePerMinute: games ? round(summaries.reduce((sum, s) => sum + s.championDamage / (s.durationSeconds / 60), 0) / games) : 0,
        damageTakenPerMinute: games ? round(summaries.reduce((sum, s) => sum + s.damageTaken / (s.durationSeconds / 60), 0) / games) : 0,
        visionScorePerMinute: games ? round(summaries.reduce((sum, s) => sum + s.visionScore / (s.durationSeconds / 60), 0) / games) : 0,
      },
      matches: summaries.map((s) => ({ matchId: s.matchId, result: s.win ? "WIN" : "LOSS", duration: durationString(s.durationSeconds), kda: `${s.kills}/${s.deaths}/${s.assists}`, cs: s.cs, csPerMinute: s.csPerMinute, damage: s.championDamage, visionScore: s.visionScore })),
    });
  },
};

export const getTimelineEvents = {
  name: "lol_get_timeline_events",
  description: "Get filtered timeline events by participant, event type, and time range",
  inputSchema: z.object({
    matchId: z.string().describe("Match ID"),
    region: regionSchema,
    participantId: z.number().optional().describe("Optional participant ID filter"),
    eventTypes: z.array(z.string()).optional().describe("Optional event type filter"),
    startTimeMs: z.number().min(0).default(0),
    endTimeMs: z.number().min(0).optional(),
    limit: z.number().min(1).max(500).default(100),
  }),
  handler: async (args: { matchId: string; region: string; participantId?: number; eventTypes?: string[]; startTimeMs: number; endTimeMs?: number; limit: number }) => {
    const timeline = await getTimeline(args.matchId, args.region);
    const events = collectEvents(timeline).filter((event) => {
      if (event.timestamp < args.startTimeMs) return false;
      if (args.endTimeMs !== undefined && event.timestamp > args.endTimeMs) return false;
      if (args.eventTypes?.length && !args.eventTypes.includes(event.type)) return false;
      if (args.participantId === undefined) return true;
      const e = event as Record<string, unknown>;
      return ["participantId", "creatorId", "killerId", "victimId"].some((key) => eventNumber(e, key) === args.participantId) || eventArray(e, "assistingParticipantIds").includes(args.participantId);
    }).slice(0, args.limit);
    return text(events.map((event) => ({ time: formatTime(event.timestamp), ...event })));
  },
};
