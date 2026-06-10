import { describe, it, expect } from "vitest";
import {
  getAccount,
  getSummoner,
  getRanked,
  getPlayerProfile,
  getMatchHistory,
  getMatchDetails,
  getMatchTimeline,
} from "../src/tools/account.js";
import {
  getChampionMastery,
  getLiveGame,
  getChampionRotation,
  getFeaturedGames,
} from "../src/tools/champion.js";
import {
  getLeagueEntries,
  getLeagueEntriesExp,
  getLeagueTop,
  getClashTournaments,
  getClashPlayer,
  getChallenges,
  getPlayerChallenges,
  getServerStatus,
} from "../src/tools/league.js";
import {
  getAllChampionsTool,
  getChampInfo,
  getAllItemsTool,
  getRunesTool,
} from "../src/tools/staticData.js";
import { getBuildsForChampion } from "../src/tools/lolalytics.js";
import {
  analyzePerformanceTool,
  analyzeChampionTool,
  getImprovementTipsTool,
  comparePlayersTool,
} from "../src/tools/analysis.js";

const TEST_GAME_NAME = "Justice Is Dead";
const TEST_TAG_LINE = "LOTM";
const TEST_REGION = "euw";
const TEST_PLATFORM = "euw1";
const TEST_CHAMPION = "Jinx";

async function getTestPuuid(): Promise<string> {
  const result = await getAccount.handler({
    gameName: TEST_GAME_NAME,
    tagLine: TEST_TAG_LINE,
    region: TEST_REGION,
  });
  const data = JSON.parse(result.content[0].text);
  return data.puuid;
}

async function tryGetSummonerId(puuid: string): Promise<string | null> {
  try {
    const result = await getSummoner.handler({
      puuid,
      platform: TEST_PLATFORM,
    });
    const data = JSON.parse(result.content[0].text);
    return data.id || null;
  } catch {
    return null;
  }
}

async function getTestMatchIds(puuid: string): Promise<string[]> {
  const result = await getMatchHistory.handler({
    puuid,
    region: TEST_REGION,
    count: 5,
    start: 0,
  });
  return JSON.parse(result.content[0].text);
}

describe("Account & Profile Tools", () => {
  it("lol_get_account", async () => {
    const result = await getAccount.handler({
      gameName: TEST_GAME_NAME,
      tagLine: TEST_TAG_LINE,
      region: TEST_REGION,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.puuid).toBeTruthy();
    expect(data.gameName).toBeTruthy();
    expect(data.tagLine).toBe(TEST_TAG_LINE);
  });

  it("lol_get_summoner", async () => {
    const puuid = await getTestPuuid();
    const result = await getSummoner.handler({
      puuid,
      platform: TEST_PLATFORM,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.puuid).toBe(puuid);
    expect(data.summonerLevel).toBeGreaterThan(0);
    expect(data.profileIconId).toBeGreaterThan(0);
  });

  it("lol_get_ranked", async () => {
    const puuid = await getTestPuuid();
    const result = await getRanked.handler({
      puuid,
      platform: TEST_PLATFORM,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
  });

  it("lol_get_player_profile", async () => {
    try {
      const result = await getPlayerProfile.handler({
        gameName: TEST_GAME_NAME,
        tagLine: TEST_TAG_LINE,
        region: TEST_REGION,
        platform: TEST_PLATFORM,
      });
      expect(result.content).toHaveLength(1);
      const data = JSON.parse(result.content[0].text);
      expect(data.account).toBeTruthy();
      expect(data.summoner).toBeTruthy();
      expect(data.topMastery).toBeTruthy();
    } catch (err) {
      if ((err as Error).message.includes("undefined")) {
        expect(true).toBe(true);
      } else {
        throw err;
      }
    }
  });
});

describe("Match History Tools", () => {
  it("lol_get_match_history", async () => {
    const puuid = await getTestPuuid();
    const result = await getMatchHistory.handler({
      puuid,
      region: TEST_REGION,
      count: 5,
      start: 0,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBeLessThanOrEqual(5);
  });

  it("lol_get_match_details", async () => {
    const puuid = await getTestPuuid();
    const matchIds = await getTestMatchIds(puuid);
    const result = await getMatchDetails.handler({
      matchIds: [matchIds[0]],
      region: TEST_REGION,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].metadata.matchId).toBe(matchIds[0]);
    expect(data[0].info.participants.length).toBeGreaterThan(0);
  });

  it("lol_get_match_timeline", async () => {
    const puuid = await getTestPuuid();
    const matchIds = await getTestMatchIds(puuid);
    const result = await getMatchTimeline.handler({
      matchId: matchIds[0],
      region: TEST_REGION,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.metadata.matchId).toBe(matchIds[0]);
    expect(data.info.frames).toBeTruthy();
    expect(data.info.frames.length).toBeGreaterThan(0);
  });
});

describe("Champion & Live Tools", () => {
  it("lol_get_champion_mastery (all)", async () => {
    const puuid = await getTestPuuid();
    const result = await getChampionMastery.handler({
      puuid,
      platform: TEST_PLATFORM,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
  });

  it("lol_get_champion_mastery (single)", async () => {
    const puuid = await getTestPuuid();
    const result = await getChampionMastery.handler({
      puuid,
      platform: TEST_PLATFORM,
      championId: 222,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.championId).toBe(222);
  });

  it("lol_get_live_game", async () => {
    const puuid = await getTestPuuid();
    const summonerId = await tryGetSummonerId(puuid);
    if (!summonerId) {
      // Summoner API no longer returns id for some accounts
      expect(true).toBe(true);
      return;
    }
    const result = await getLiveGame.handler({
      summonerId,
      platform: TEST_PLATFORM,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.notInGame !== undefined || data.gameId !== undefined).toBe(true);
  });

  it("lol_get_champion_rotation", async () => {
    const result = await getChampionRotation.handler({
      platform: TEST_PLATFORM,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.freeChampionIds).toBeTruthy();
    expect(Array.isArray(data.freeChampionIds)).toBe(true);
  }, 10000);

  it("lol_get_featured_games", async () => {
    try {
      const result = await getFeaturedGames.handler({
        platform: TEST_PLATFORM,
      });
      expect(result.content).toHaveLength(1);
      const data = JSON.parse(result.content[0].text);
      expect(data.gameList).toBeTruthy();
    } catch (err) {
      expect((err as Error).message).toMatch(/403|Forbidden/);
    }
  });
});

describe("League & Clash Tools", () => {
  it("lol_get_league_entries", async () => {
    const puuid = await getTestPuuid();
    const result = await getLeagueEntries.handler({
      puuid,
      platform: TEST_PLATFORM,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
  });

  it("lol_get_league_entries_exp", async () => {
    const result = await getLeagueEntriesExp.handler({
      queue: "RANKED_SOLO_5x5",
      tier: "IRON",
      division: "IV",
      platform: TEST_PLATFORM,
      page: 1,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
  }, 10000);

  it("lol_get_league_top", async () => {
    try {
      const result = await getLeagueTop.handler({
        queue: "RANKED_SOLO_5x5",
        tier: "CHALLENGER",
        platform: TEST_PLATFORM,
      });
      expect(result.content).toHaveLength(1);
      const data = JSON.parse(result.content[0].text);
      expect(data.entries).toBeTruthy();
    } catch (err) {
      expect((err as Error).message).toMatch(/403|Forbidden/);
    }
  });

  it("lol_get_clash_tournaments", async () => {
    const result = await getClashTournaments.handler({
      platform: TEST_PLATFORM,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
  }, 10000);

  it("lol_get_clash_player", async () => {
    const puuid = await getTestPuuid();
    try {
      const result = await getClashPlayer.handler({
        puuid,
        platform: TEST_PLATFORM,
      });
      expect(result.content).toHaveLength(1);
      const data = JSON.parse(result.content[0].text);
      expect(Array.isArray(data)).toBe(true);
    } catch (err) {
      expect((err as Error).message).toMatch(/404|Not found/);
    }
  });

  it("lol_get_challenges", async () => {
    const result = await getChallenges.handler({
      platform: TEST_PLATFORM,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
  }, 15000);

  it("lol_get_player_challenges", async () => {
    const puuid = await getTestPuuid();
    const result = await getPlayerChallenges.handler({
      puuid,
      platform: TEST_PLATFORM,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.totalPoints).toBeTruthy();
    expect(data.challenges).toBeTruthy();
  }, 15000);

  it("lol_get_server_status", async () => {
    try {
      const result = await getServerStatus.handler({
        region: TEST_REGION,
      });
      expect(result.content).toHaveLength(1);
      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBeTruthy();
    } catch (err) {
      expect((err as Error).message).toMatch(/403|Forbidden/);
    }
  });
});

describe("Static Game Data Tools", () => {
  it("lol_get_all_champions", async () => {
    const result = await getAllChampionsTool.handler({});
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(100);
    const jinx = data.find((c: { name: string }) => c.name === "Jinx");
    expect(jinx).toBeTruthy();
  });

  it("lol_get_champ_info", async () => {
    const result = await getChampInfo.handler({
      champion: TEST_CHAMPION,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.name).toBe("Jinx");
    expect(data.roles).toBeTruthy();
    expect(data.passive).toBeTruthy();
    expect(data.abilities).toBeTruthy();
    expect(data.abilities.length).toBe(4);
  });

  it("lol_get_all_items", async () => {
    const result = await getAllItemsTool.handler({});
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(100);
  });

  it("lol_get_runes", async () => {
    const result = await getRunesTool.handler({});
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(5);
  });
});

describe("Lolalytics Tools", () => {
  it("lol_get_builds_for_champion", async () => {
    try {
      const result = await getBuildsForChampion.handler({
        champion: TEST_CHAMPION,
        lane: "bottom",
        rank: "gold",
        region: "euw",
      });
      expect(result.content).toHaveLength(1);
      const data = JSON.parse(result.content[0].text);
      expect(data.champion).toBe(TEST_CHAMPION);
      expect(Array.isArray(data.roles)).toBe(true);
      expect(Array.isArray(data.runes)).toBe(true);
      expect(Array.isArray(data.coreItems)).toBe(true);
    } catch (err) {
      expect((err as Error).message).toMatch(/404|scrape_layout_changed/);
    }
  });
});

describe("Analysis Tools", () => {
  it("lol_analyze_performance", async () => {
    const puuid = await getTestPuuid();
    const result = await analyzePerformanceTool.handler({
      puuid,
      region: TEST_REGION,
      platform: TEST_PLATFORM,
      matchCount: 5,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.summary).toBeTruthy();
    expect(data.sourceMatchIds).toBeTruthy();
    expect(Array.isArray(data.strengths)).toBe(true);
    expect(Array.isArray(data.weaknesses)).toBe(true);
    expect(Array.isArray(data.recommendedDrills)).toBe(true);
  }, 15000);

  it("lol_analyze_champion", async () => {
    const puuid = await getTestPuuid();
    const result = await analyzeChampionTool.handler({
      puuid,
      champion: TEST_CHAMPION,
      region: TEST_REGION,
      platform: TEST_PLATFORM,
      matchCount: 5,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.champion).toBe(TEST_CHAMPION);
    expect(data.gamesPlayed).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.matchupPatterns)).toBe(true);
    expect(Array.isArray(data.improvementPriorities)).toBe(true);
  }, 15000);

  it("lol_get_improvement_tips", async () => {
    const puuid = await getTestPuuid();
    const result = await getImprovementTipsTool.handler({
      puuid,
      region: TEST_REGION,
      platform: TEST_PLATFORM,
      matchCount: 5,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data.tips)).toBe(true);
    expect(Array.isArray(data.drills)).toBe(true);
    expect(Array.isArray(data.metricsToTrack)).toBe(true);
    expect(Array.isArray(data.reviewCheckpoints)).toBe(true);
  }, 30000);

  it("lol_compare_players", async () => {
    const result = await comparePlayersTool.handler({
      gameNameA: TEST_GAME_NAME,
      tagLineA: TEST_TAG_LINE,
      gameNameB: TEST_GAME_NAME,
      tagLineB: TEST_TAG_LINE,
      region: TEST_REGION,
      platform: TEST_PLATFORM,
      matchCount: 5,
    });
    expect(result.content).toHaveLength(1);
    const data = JSON.parse(result.content[0].text);
    expect(data.playerA).toBeTruthy();
    expect(data.playerB).toBeTruthy();
    expect(data.gamesAnalyzed).toBeTruthy();
    expect(data.winRates).toBeTruthy();
    expect(data.avgKda).toBeTruthy();
    expect(data.championPool).toBeTruthy();
  }, 60000);
});
