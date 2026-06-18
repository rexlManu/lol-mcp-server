import { describe, expect, it } from "vitest";
import { getMatchHistory } from "../src/tools/account.js";
import {
  getChampionReview,
  getPlayerDeaths,
  getPlayerMatchSummary,
  getPlayerVisionSummary,
  getTimelineEvents,
} from "../src/tools/review.js";

describe("review tool schemas", () => {
  it("accepts championName and championId filters for match history", () => {
    expect(() =>
      getMatchHistory.inputSchema.parse({
        puuid: "puuid",
        region: "euw",
        count: 10,
        start: 0,
        queue: 420,
        championName: "Viktor",
      })
    ).not.toThrow();

    expect(() =>
      getMatchHistory.inputSchema.parse({
        puuid: "puuid",
        region: "euw",
        count: 10,
        start: 0,
        championId: 112,
      })
    ).not.toThrow();
  });

  it("defines compact match review tools", () => {
    expect(getPlayerMatchSummary.name).toBe("lol_get_player_match_summary");
    expect(getPlayerDeaths.name).toBe("lol_get_player_deaths");
    expect(getPlayerVisionSummary.name).toBe("lol_get_player_vision_summary");
    expect(getChampionReview.name).toBe("lol_get_champion_review");
    expect(getTimelineEvents.name).toBe("lol_get_timeline_events");
  });

  it("validates timeline event filters", () => {
    const input = getTimelineEvents.inputSchema.parse({
      matchId: "EUW1_123",
      participantId: 3,
      eventTypes: ["CHAMPION_KILL", "WARD_PLACED"],
      startTimeMs: 0,
      endTimeMs: 900000,
    });

    expect(input.region).toBe("euw");
    expect(input.limit).toBe(100);
    expect(input.participantId).toBe(3);
  });
});
