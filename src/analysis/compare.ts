export interface PlayerComparison {
  playerA: { gameName: string; tagLine: string };
  playerB: { gameName: string; tagLine: string };
  gamesAnalyzed: { a: number; b: number };
  winRates: { a: number; b: number };
  avgKda: { a: string; b: string };
  avgCsPerMin: { a: number; b: number };
  avgVisionPerMin: { a: number; b: number };
  avgDamageToChampions: { a: number; b: number };
  avgGold: { a: number; b: number };
  championPool: { a: string[]; b: string[] };
  commonChampions: string[];
  roleDistribution: { a: Record<string, number>; b: Record<string, number> };
  strengthsA: string[];
  strengthsB: string[];
}

import type { RiotMatch } from "../riot/types.js";

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function comparePlayers(
  matchesA: RiotMatch[],
  matchesB: RiotMatch[],
  puuidA: string,
  puuidB: string,
  gameNameA: string,
  tagLineA: string,
  gameNameB: string,
  tagLineB: string
): PlayerComparison {
  const partsA = matchesA
    .map((m) => m.info.participants.find((p) => p.puuid === puuidA))
    .filter((p) => p !== undefined);
  const partsB = matchesB
    .map((m) => m.info.participants.find((p) => p.puuid === puuidB))
    .filter((p) => p !== undefined);

  const calcStats = (parts: NonNullable<(typeof partsA)[number]>[]) => {
    if (parts.length === 0) {
      return {
        wins: 0, total: 0, winRate: 0,
        kills: 0, deaths: 0, assists: 0, kda: "N/A",
        csPerMin: 0, visionPerMin: 0, dmg: 0, gold: 0,
        champs: [] as string[], roles: {} as Record<string, number>,
      };
    }
    const wins = parts.filter((p) => p.win).length;
    const kills = avg(parts.map((p) => p.kills));
    const deaths = avg(parts.map((p) => p.deaths));
    const assists = avg(parts.map((p) => p.assists));
    const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
    const champSet = new Map<string, number>();
    const roleMap: Record<string, number> = {};
    for (const p of parts) {
      champSet.set(p.championName, (champSet.get(p.championName) ?? 0) + 1);
      const role = p.teamPosition || p.lane || "unknown";
      roleMap[role] = (roleMap[role] ?? 0) + 1;
    }
    return {
      wins, total: parts.length, winRate: (wins / parts.length) * 100,
      kills, deaths, assists, kda: `${kills.toFixed(1)}/${deaths.toFixed(1)}/${assists.toFixed(1)} (${kda.toFixed(2)})`,
      csPerMin: avg(parts.map((p) => (p.totalMinionsKilled + p.neutralMinionsKilled) / 30)),
      visionPerMin: avg(parts.map((p) => p.visionScore / 30)),
      dmg: avg(parts.map((p) => p.totalDamageDealtToChampions)),
      gold: avg(parts.map((p) => p.goldEarned)),
      champs: [...champSet.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n),
      roles: roleMap,
    };
  };

  const statsA = calcStats(partsA);
  const statsB = calcStats(partsB);

  const commonChamps = statsA.champs.filter((c) => statsB.champs.includes(c));

  const strengthsA: string[] = [];
  const strengthsB: string[] = [];

  if (statsA.winRate > statsB.winRate) strengthsA.push("Higher win rate");
  else if (statsB.winRate > statsA.winRate) strengthsB.push("Higher win rate");

  if (statsA.csPerMin > statsB.csPerMin) strengthsA.push("Better CS");
  else if (statsB.csPerMin > statsA.csPerMin) strengthsB.push("Better CS");

  if (statsA.visionPerMin > statsB.visionPerMin) strengthsA.push("Better vision");
  else if (statsB.visionPerMin > statsA.visionPerMin) strengthsB.push("Better vision");

  if (statsA.dmg > statsB.dmg) strengthsA.push("More damage to champions");
  else if (statsB.dmg > statsA.dmg) strengthsB.push("More damage to champions");

  return {
    playerA: { gameName: gameNameA, tagLine: tagLineA },
    playerB: { gameName: gameNameB, tagLine: tagLineB },
    gamesAnalyzed: { a: statsA.total, b: statsB.total },
    winRates: { a: Math.round(statsA.winRate * 10) / 10, b: Math.round(statsB.winRate * 10) / 10 },
    avgKda: { a: statsA.kda, b: statsB.kda },
    avgCsPerMin: { a: Math.round(statsA.csPerMin * 10) / 10, b: Math.round(statsB.csPerMin * 10) / 10 },
    avgVisionPerMin: { a: Math.round(statsA.visionPerMin * 10) / 10, b: Math.round(statsB.visionPerMin * 10) / 10 },
    avgDamageToChampions: { a: Math.round(statsA.dmg), b: Math.round(statsB.dmg) },
    avgGold: { a: Math.round(statsA.gold), b: Math.round(statsB.gold) },
    championPool: { a: statsA.champs.slice(0, 5), b: statsB.champs.slice(0, 5) },
    commonChampions: commonChamps.slice(0, 5),
    roleDistribution: { a: statsA.roles, b: statsB.roles },
    strengthsA,
    strengthsB,
  };
}
