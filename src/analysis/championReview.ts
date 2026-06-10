import type { RiotMatch, RiotMatchParticipant } from "../riot/types.js";

export interface ChampionAnalysis {
  champion: string;
  gamesPlayed: number;
  winRate: number;
  avgKda: string;
  avgCsPerMin: number;
  avgVisionPerMin: number;
  avgDamageToChampions: number;
  avgGold: number;
  matchupPatterns: string[];
  buildConsistency: string;
  runeConsistency: string;
  skillOrderNotes: string;
  deathPatterns: string;
  objectivePatterns: string;
  csGoldXpTrends: string;
  improvementPriorities: string[];
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function analyzeChampion(
  matches: RiotMatch[],
  puuid: string,
  champion: string
): ChampionAnalysis {
  const champMatches = matches.filter((m) =>
    m.info.participants.some(
      (p) => p.puuid === puuid && p.championName.toLowerCase() === champion.toLowerCase()
    )
  );

  const participants = champMatches
    .map((m) => m.info.participants.find((p) => p.puuid === puuid))
    .filter((p): p is RiotMatchParticipant => p !== null);

  if (participants.length === 0) {
    return {
      champion,
      gamesPlayed: 0,
      winRate: 0,
      avgKda: "N/A",
      avgCsPerMin: 0,
      avgVisionPerMin: 0,
      avgDamageToChampions: 0,
      avgGold: 0,
      matchupPatterns: ["No games found on this champion"],
      buildConsistency: "No data",
      runeConsistency: "No data",
      skillOrderNotes: "No data",
      deathPatterns: "No data",
      objectivePatterns: "No data",
      csGoldXpTrends: "No data",
      improvementPriorities: [],
    };
  }

  const wins = participants.filter((p) => p.win).length;
  const winRate = (wins / participants.length) * 100;

  const kills = avg(participants.map((p) => p.kills));
  const deaths = avg(participants.map((p) => p.deaths));
  const assists = avg(participants.map((p) => p.assists));
  const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;

  const durations = champMatches.map((m) => m.info.gameDuration / 60);
  const csPerMin = avg(
    participants.map((p, i) => {
      const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
      return durations[i] > 0 ? cs / durations[i] : 0;
    })
  );
  const visionPerMin = avg(
    participants.map((p, i) =>
      durations[i] > 0 ? p.visionScore / durations[i] : 0
    )
  );

  const dmg = avg(participants.map((p) => p.totalDamageDealtToChampions));
  const gold = avg(participants.map((p) => p.goldEarned));

  const matchupMap = new Map<string, { wins: number; total: number }>();
  for (const match of champMatches) {
    const me = match.info.participants.find((p) => p.puuid === puuid);
    if (!me) continue;
    const enemies = match.info.participants.filter(
      (p) => p.teamId !== me.teamId && p.teamPosition === me.teamPosition
    );
    for (const enemy of enemies) {
      const key = enemy.championName;
      const entry = matchupMap.get(key) ?? { wins: 0, total: 0 };
      entry.total++;
      if (me.win) entry.wins++;
      matchupMap.set(key, entry);
    }
  }

  const matchups = [...matchupMap.entries()]
    .filter(([, v]) => v.total >= 2)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(
      ([champ, v]) =>
        `${champ}: ${v.wins}/${v.total} (${((v.wins / v.total) * 100).toFixed(0)}%)`
    );

  const itemSets = new Set<string>();
  for (const p of participants) {
    const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5]
      .filter((i) => i !== 0)
      .sort()
      .join(",");
    itemSets.add(items);
  }
  const buildConsistency =
    itemSets.size <= 3
      ? `Consistent builds (${itemSets.size} unique sets)`
      : `Variable builds (${itemSets.size} unique sets) — consider standardizing`;

  const improvements: string[] = [];
  if (csPerMin < 6) improvements.push("Improve CS efficiency");
  if (deaths > 6) improvements.push("Reduce deaths");
  if (visionPerMin < 1) improvements.push("Better vision control");
  if (winRate < 50) improvements.push("Focus on matchups and macro");

  return {
    champion,
    gamesPlayed: participants.length,
    winRate: Math.round(winRate * 10) / 10,
    avgKda: `${kills.toFixed(1)}/${deaths.toFixed(1)}/${assists.toFixed(1)} (${kda.toFixed(2)})`,
    avgCsPerMin: Math.round(csPerMin * 10) / 10,
    avgVisionPerMin: Math.round(visionPerMin * 10) / 10,
    avgDamageToChampions: Math.round(dmg),
    avgGold: Math.round(gold),
    matchupPatterns: matchups.length > 0 ? matchups : ["Not enough matchup data"],
    buildConsistency,
    runeConsistency: "Check rune pages in client for consistency",
    skillOrderNotes: "Verify skill order matches optimal build",
    deathPatterns:
      deaths > 7
        ? `High avg deaths (${deaths.toFixed(1)}) — review positioning`
        : `Avg deaths ${deaths.toFixed(1)} — acceptable`,
    objectivePatterns: `Dragons: ${avg(participants.map((p) => p.dragonKills)).toFixed(1)}/game, Barons: ${avg(participants.map((p) => p.baronKills)).toFixed(1)}/game`,
    csGoldXpTrends: `CS/min: ${csPerMin.toFixed(1)}, Gold: ${Math.round(gold).toLocaleString()}`,
    improvementPriorities: improvements.length > 0 ? improvements : ["Continue current play"],
  };
}
