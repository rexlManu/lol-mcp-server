import { describe, it, expect } from "vitest";
import { analyzePerformance } from "../src/analysis/performance.js";
import type { RiotMatch } from "../src/riot/types.js";

function makeMatch(puuid: string, overrides: Partial<RiotMatch["info"]["participants"][0]> = {}): RiotMatch {
  return {
    metadata: { dataVersion: "2", matchId: "EUW1_123", participants: [puuid] },
    info: {
      gameCreation: Date.now(),
      gameDuration: 1800,
      gameEndTimestamp: Date.now(),
      gameId: 123,
      gameMode: "CLASSIC",
      gameName: "",
      gameStartTimestamp: Date.now() - 1800000,
      gameType: "MATCHED_GAME",
      gameVersion: "14.1.1",
      mapId: 11,
      platformId: "EUW1",
      queueId: 420,
      participants: [
        {
          puuid,
          summonerName: "Test",
          riotIdGameName: "Test",
          riotIdTagline: "EUW",
          championId: 1,
          championName: "Annie",
          teamId: 100,
          win: true,
          kills: 8,
          deaths: 3,
          assists: 10,
          champLevel: 16,
          goldEarned: 12000,
          totalMinionsKilled: 180,
          neutralMinionsKilled: 10,
          item0: 1001, item1: 3118, item2: 3089, item3: 0, item4: 0, item5: 0, item6: 3340,
          visionScore: 30,
          wardsPlaced: 10,
          wardsKilled: 2,
          totalDamageDealtToChampions: 20000,
          totalDamageTaken: 15000,
          totalHealsOnTeammates: 0,
          totalDamageShieldedOnTeammates: 0,
          largestKillingSpree: 5,
          largestMultiKill: 2,
          firstBloodKill: false,
          firstBloodAssist: false,
          firstTowerKill: false,
          firstTowerAssist: false,
          dragonKills: 1,
          baronKills: 0,
          inhibitorKills: 1,
          turretKills: 2,
          role: "SOLO",
          lane: "MIDDLE",
          individualPosition: "MIDDLE",
          teamPosition: "MIDDLE",
          ...overrides,
        },
      ],
      teams: [
        { teamId: 100, win: true, bans: [], objectives: {} },
        { teamId: 200, win: false, bans: [], objectives: {} },
      ],
    },
  };
}

describe("analyzePerformance", () => {
  const puuid = "test-puuid-123";

  it("returns no-data message for empty matches", () => {
    const result = analyzePerformance([], puuid);
    expect(result.summary).toContain("No matches found");
  });

  it("analyzes matches correctly", () => {
    const matches = [
      makeMatch(puuid, { win: true, kills: 10, deaths: 2, assists: 8, totalMinionsKilled: 200 }),
      makeMatch(puuid, { win: false, kills: 5, deaths: 6, assists: 4, totalMinionsKilled: 150 }),
    ];
    const result = analyzePerformance(matches, puuid);
    expect(result.sourceMatchIds).toHaveLength(2);
    expect(result.summary).toContain("2 games analyzed");
    expect(result.summary).toContain("50.0%");
  });

  it("identifies low CS as weakness", () => {
    const matches = [makeMatch(puuid, { totalMinionsKilled: 50, neutralMinionsKilled: 0 })];
    const result = analyzePerformance(matches, puuid);
    expect(result.weaknesses.some((w) => w.includes("CS"))).toBe(true);
  });
});
