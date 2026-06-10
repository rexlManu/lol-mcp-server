import type { RiotMatch, RiotMatchParticipant } from "../riot/types.js";

export interface ImprovementTips {
  tips: { priority: number; tip: string; reason: string }[];
  drills: string[];
  metricsToTrack: string[];
  reviewCheckpoints: string[];
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function getImprovementTips(
  matches: RiotMatch[],
  puuid: string,
  role?: string,
  champion?: string,
  goal?: string
): ImprovementTips {
  const participants = matches
    .map((m) => m.info.participants.find((p) => p.puuid === puuid))
    .filter((p): p is RiotMatchParticipant => p !== null);

  const filtered = participants.filter((p) => {
    if (role && p.teamPosition.toLowerCase() !== role.toLowerCase()) return false;
    if (champion && p.championName.toLowerCase() !== champion.toLowerCase()) return false;
    return true;
  });

  const data = filtered.length > 0 ? filtered : participants;

  if (data.length === 0) {
    return {
      tips: [],
      drills: ["Play more games to generate analysis data"],
      metricsToTrack: [],
      reviewCheckpoints: [],
    };
  }

  const tips: ImprovementTips["tips"] = [];
  const drills: string[] = [];
  const metrics: string[] = [];
  const checkpoints: string[] = [];

  const deaths = avg(data.map((p) => p.deaths));
  const cs = avg(
    data.map((p) => p.totalMinionsKilled + p.neutralMinionsKilled)
  );
  const durations = matches.map((m) => m.info.gameDuration / 60);
  const csPerMin = avg(
    data.map((p, i) => {
      const totalCs = p.totalMinionsKilled + p.neutralMinionsKilled;
      return durations[i] > 0 ? totalCs / durations[i] : 0;
    })
  );
  const vision = avg(data.map((p) => p.visionScore));
  const visionPerMin = avg(
    data.map((p, i) => (durations[i] > 0 ? p.visionScore / durations[i] : 0))
  );
  const wins = data.filter((p) => p.win).length;
  const winRate = (wins / data.length) * 100;

  if (csPerMin < 6) {
    tips.push({
      priority: 1,
      tip: "Improve last-hitting",
      reason: `CS/min is ${csPerMin.toFixed(1)} (target: 7+)`,
    });
    drills.push("Practice tool: 10 min no-items last-hit challenge (target: 80+)");
    metrics.push("CS per minute");
  }

  if (deaths > 6) {
    tips.push({
      priority: 2,
      tip: "Reduce deaths",
      reason: `Avg ${deaths.toFixed(1)} deaths/game (target: <5)`,
    });
    drills.push("After each death, write down why it happened");
    metrics.push("Deaths per game");
  }

  if (visionPerMin < 1) {
    tips.push({
      priority: 3,
      tip: "Improve vision control",
      reason: `Vision/min is ${visionPerMin.toFixed(1)} (target: 1.5+)`,
    });
    drills.push("Buy control ward every back, use trinket before each fight");
    metrics.push("Vision score per minute");
  }

  if (winRate < 50) {
    tips.push({
      priority: 4,
      tip: "Narrow champion pool",
      reason: `Win rate is ${winRate.toFixed(0)}% — focus on 2-3 champions`,
    });
    drills.push("Pick 2-3 champions and play them exclusively for 20 games");
    metrics.push("Win rate per champion");
  }

  if (role === "support" || data.some((p) => p.teamPosition === "UTILITY")) {
    if (vision < 40) {
      tips.push({
        priority: 2,
        tip: "More wards as support",
        reason: `Vision score ${vision.toFixed(0)} (target: 50+)`,
      });
    }
  }

  if (goal) {
    tips.push({
      priority: 5,
      tip: `Focus on goal: ${goal}`,
      reason: "User-specified improvement goal",
    });
  }

  checkpoints.push("After every 10 games, review metrics");
  checkpoints.push("Watch 1 replay per week focusing on deaths");
  checkpoints.push("Compare CS/min trend over 20 games");

  metrics.push("KDA ratio", "Gold per minute", "Damage to champions per minute");

  return {
    tips: tips.sort((a, b) => a.priority - b.priority),
    drills,
    metricsToTrack: metrics,
    reviewCheckpoints: checkpoints,
  };
}
