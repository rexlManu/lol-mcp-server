import type {
  RiotAccount,
  RiotSummoner,
  RiotLeagueEntry,
  RiotMatch,
  RiotMatchParticipant,
  RiotTimeline,
} from "../riot/types.js";

export function formatSummoner(
  account: RiotAccount,
  summoner: RiotSummoner
): string {
  return [
    `Summoner: ${account.gameName}#${account.tagLine}`,
    `Level: ${summoner.summonerLevel}`,
    `Profile Icon ID: ${summoner.profileIconId}`,
    `PUUID: ${summoner.puuid}`,
  ].join("\n");
}

export function formatRanked(entries: RiotLeagueEntry[]): string {
  if (entries.length === 0) return "No ranked stats found.";

  return entries
    .map((e) => {
      const queue =
        e.queueType === "RANKED_SOLO_5x5"
          ? "Solo/Duo"
          : e.queueType === "RANKED_FLEX_SR"
            ? "Flex 5v5"
            : e.queueType;
      const total = e.wins + e.losses;
      const wr = total > 0 ? ((e.wins / total) * 100).toFixed(1) : "0.0";
      return [
        `${queue}: ${e.tier} ${e.rank} - ${e.leaguePoints} LP`,
        `  Record: ${e.wins}W ${e.losses}L (${wr}%)`,
        `  Hot Streak: ${e.hotStreak}, Veteran: ${e.veteran}, Fresh Blood: ${e.freshBlood}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function formatMatchHistory(matchIds: string[]): string {
  if (matchIds.length === 0) return "No matches found.";
  return matchIds.map((id, i) => `${i + 1}. ${id}`).join("\n");
}

function formatParticipant(p: RiotMatchParticipant): string {
  const kda =
    p.deaths === 0
      ? "Perfect"
      : ((p.kills + p.assists) / p.deaths).toFixed(2);
  const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
  const items = [
    p.item0,
    p.item1,
    p.item2,
    p.item3,
    p.item4,
    p.item5,
  ].filter((i) => i !== 0);
  const result = p.win ? "WIN" : "LOSS";

  return [
    `${p.riotIdGameName}#${p.riotIdTagline} - ${p.championName} [${result}]`,
    `  KDA: ${p.kills}/${p.deaths}/${p.assists} (${kda}) | Level ${p.champLevel}`,
    `  CS: ${cs} (${p.totalMinionsKilled} lane, ${p.neutralMinionsKilled} jungle)`,
    `  Gold: ${p.goldEarned.toLocaleString()} | Vision: ${p.visionScore}`,
    `  Damage to Champions: ${p.totalDamageDealtToChampions.toLocaleString()} | Damage Taken: ${p.totalDamageTaken.toLocaleString()}`,
    `  Position: ${p.teamPosition || p.lane}`,
    items.length > 0 ? `  Items: ${items.join(", ")}` : null,
    p.firstBloodKill ? "  First Blood!" : null,
    p.dragonKills > 0 ? `  Dragons: ${p.dragonKills}` : null,
    p.baronKills > 0 ? `  Barons: ${p.baronKills}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatMatchDetails(match: RiotMatch): string {
  const info = match.info;
  const durationMin = Math.floor(info.gameDuration / 60);
  const durationSec = info.gameDuration % 60;
  const date = new Date(info.gameCreation).toISOString().split("T")[0];

  const team1 = info.participants.filter((p) => p.teamId === 100);
  const team2 = info.participants.filter((p) => p.teamId === 200);

  const team1Obj = info.teams.find((t) => t.teamId === 100);
  const team2Obj = info.teams.find((t) => t.teamId === 200);

  const formatObjectives = (
    team: (typeof info.teams)[0] | undefined
  ): string => {
    if (!team) return "";
    const obj = team.objectives;
    const parts: string[] = [];
    if (obj.dragon) parts.push(`Dragons: ${obj.dragon.kills}`);
    if (obj.baron) parts.push(`Barons: ${obj.baron.kills}`);
    if (obj.tower) parts.push(`Towers: ${obj.tower.kills}`);
    if (obj.inhibitor) parts.push(`Inhibitors: ${obj.inhibitor.kills}`);
    return parts.join(" | ");
  };

  return [
    `Match: ${match.metadata.matchId}`,
    `Mode: ${info.gameMode} | Queue: ${info.queueId} | Patch: ${info.gameVersion}`,
    `Date: ${date} | Duration: ${durationMin}m ${durationSec}s`,
    "",
    `Team 1 (Blue) - ${team1Obj?.win ? "WIN" : "LOSS"}`,
    formatObjectives(team1Obj),
    team1.map(formatParticipant).join("\n\n"),
    "",
    `Team 2 (Red) - ${team2Obj?.win ? "WIN" : "LOSS"}`,
    formatObjectives(team2Obj),
    team2.map(formatParticipant).join("\n\n"),
  ].join("\n");
}

export function formatTimeline(timeline: RiotTimeline): string {
  const frames = timeline.info.frames;
  const importantEvents: string[] = [];

  for (const frame of frames) {
    const minutes = Math.floor(frame.timestamp / 60000);
    const seconds = Math.floor((frame.timestamp % 60000) / 1000);
    const time = `[${minutes}:${seconds.toString().padStart(2, "0")}]`;

    for (const event of frame.events) {
      const e = event as Record<string, unknown>;
      switch (event.type) {
        case "CHAMPION_KILL": {
          const assists = e.assistingParticipantIds as unknown[] | undefined;
          importantEvents.push(
            `${time} Kill: ${e.killerName} -> ${e.victimName}${assists ? ` (assists: ${assists.length})` : ""}`
          );
          break;
        }
        case "ELITE_MONSTER_KILL":
          importantEvents.push(
            `${time} ${e.monsterType}: ${e.killerName} (team ${e.teamId})`
          );
          break;
        case "BUILDING_KILL":
          importantEvents.push(
            `${time} ${e.buildingType} destroyed: ${e.killerName}${e.teamId ? ` (team ${e.teamId})` : ""}`
          );
          break;
        case "ITEM_FIRST_PURCHASED": {
          const itemId = e.itemId as number | undefined;
          if (itemId && itemId > 0) {
            importantEvents.push(
              `${time} First item: ${e.participantId} bought item ${itemId}`
            );
          }
          break;
        }
      }
    }
  }

  return [
    `Timeline for: ${timeline.metadata.matchId}`,
    `Total frames: ${frames.length} | Interval: ${timeline.info.frameInterval}ms`,
    "",
    `Key Events (${importantEvents.length}):`,
    importantEvents.join("\n"),
  ].join("\n");
}
