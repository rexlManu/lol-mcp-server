import type { RiotMatch, RiotMatchParticipant } from "../riot/types.js";

export interface PerformanceAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recurringMistakes: string[];
  laning: string;
  midgame: string;
  lategame: string;
  championPool: string;
  recommendedDrills: string[];
  trainingPriorities: string[];
  sourceMatchIds: string[];
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function findParticipant(match: RiotMatch, puuid: string): RiotMatchParticipant | null {
  return match.info.participants.find((p) => p.puuid === puuid) ?? null;
}

export function analyzePerformance(
  matches: RiotMatch[],
  puuid: string
): PerformanceAnalysis {
  const participants = matches
    .map((m) => findParticipant(m, puuid))
    .filter((p): p is RiotMatchParticipant => p !== null);

  if (participants.length === 0) {
    return {
      summary: "No matches found for this player.",
      strengths: [],
      weaknesses: [],
      recurringMistakes: [],
      laning: "No data",
      midgame: "No data",
      lategame: "No data",
      championPool: "No data",
      recommendedDrills: [],
      trainingPriorities: [],
      sourceMatchIds: [],
    };
  }

  const wins = participants.filter((p) => p.win).length;
  const losses = participants.length - wins;
  const winRate = ((wins / participants.length) * 100).toFixed(1);

  const kills = avg(participants.map((p) => p.kills));
  const deaths = avg(participants.map((p) => p.deaths));
  const assists = avg(participants.map((p) => p.assists));
  const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;

  const cs = avg(
    participants.map((p) => p.totalMinionsKilled + p.neutralMinionsKilled)
  );
  const durations = matches.map((m) => m.info.gameDuration / 60);
  const csPerMin = avg(
    participants.map((p, i) => {
      const totalCs = p.totalMinionsKilled + p.neutralMinionsKilled;
      return durations[i] > 0 ? totalCs / durations[i] : 0;
    })
  );

  const vision = avg(participants.map((p) => p.visionScore));
  const visionPerMin = avg(
    participants.map((p, i) =>
      durations[i] > 0 ? p.visionScore / durations[i] : 0
    )
  );

  const dmgToChamps = avg(
    participants.map((p) => p.totalDamageDealtToChampions)
  );
  const dmgTaken = avg(participants.map((p) => p.totalDamageTaken));
  const gold = avg(participants.map((p) => p.goldEarned));

  const champs = new Map<string, number>();
  for (const p of participants) {
    champs.set(p.championName, (champs.get(p.championName) ?? 0) + 1);
  }
  const champPool = [...champs.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} (${count})`)
    .join(", ");

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const mistakes: string[] = [];

  if (winRate >= "55") strengths.push(`Good win rate (${winRate}%)`);
  if (winRate < "45") weaknesses.push(`Low win rate (${winRate}%)`);
  if (kda >= 3) strengths.push(`Strong KDA ratio (${kda.toFixed(2)})`);
  if (kda < 2) weaknesses.push(`Low KDA ratio (${kda.toFixed(2)})`);
  if (csPerMin >= 7) strengths.push(`Good CS (${csPerMin.toFixed(1)}/min)`);
  if (csPerMin < 5) {
    weaknesses.push(`Low CS (${csPerMin.toFixed(1)}/min) — farm more`);
    mistakes.push("Missing minion kills — focus on last-hitting");
  }
  if (visionPerMin >= 1.5) strengths.push(`Good vision control (${visionPerMin.toFixed(1)}/min)`);
  if (visionPerMin < 0.8) {
    weaknesses.push(`Low vision score (${visionPerMin.toFixed(1)}/min)`);
    mistakes.push("Not buying enough wards");
  }
  if (deaths > 7) {
    weaknesses.push(`High deaths per game (${deaths.toFixed(1)})`);
    mistakes.push("Dying too often — play safer");
  }

  const avgDuration = avg(durations);
  const laning =
    avgDuration < 25
      ? "Games tend to be short — focus on early game impact"
      : avgDuration < 35
        ? "Average game length — balanced early/mid game"
        : "Games go long — focus on late-game scaling and positioning";

  const midgame =
    csPerMin >= 7
      ? "Midgame farming looks solid"
      : "Midgame: improve CS during rotations and objective fights";

  const lategame =
    deaths <= 5
      ? "Good late-game positioning (low deaths)"
      : "Late-game deaths too high — improve positioning in teamfights";

  const drills: string[] = [];
  const priorities: string[] = [];

  if (csPerMin < 6) {
    drills.push("Practice last-hitting in practice tool (target: 8+ CS/min)");
    priorities.push("Improve farming efficiency");
  }
  if (visionPerMin < 1) {
    drills.push("Buy control wards every back, sweep trinket at level 9");
    priorities.push("Improve vision control");
  }
  if (deaths > 6) {
    drills.push("Review deaths in replays — identify avoidable ones");
    priorities.push("Reduce deaths");
  }
  if (winRate < "50") {
    drills.push("Focus on 2-3 champions to improve consistency");
    priorities.push("Narrow champion pool");
  }
  if (drills.length === 0) {
    drills.push("Continue current playstyle — focus on consistency");
    priorities.push("Maintain current performance level");
  }

  return {
    summary: `${participants.length} games analyzed. Win rate: ${winRate}% (${wins}W/${losses}L). Avg KDA: ${kills.toFixed(1)}/${deaths.toFixed(1)}/${assists.toFixed(1)} (${kda.toFixed(2)}). Avg CS/min: ${csPerMin.toFixed(1)}. Avg vision/min: ${visionPerMin.toFixed(1)}. Avg gold: ${Math.round(gold).toLocaleString()}.`,
    strengths,
    weaknesses,
    recurringMistakes: mistakes,
    laning,
    midgame,
    lategame,
    championPool: champPool || "No champions played",
    recommendedDrills: drills,
    trainingPriorities: priorities,
    sourceMatchIds: matches.map((m) => m.metadata.matchId),
  };
}
