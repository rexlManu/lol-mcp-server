import { z } from "zod";
import { getAllChampions, getChampionFull, getAllItems, getRunesReforged } from "../static-data/dataDragon.js";
import { scrapeChampionWiki } from "../static-data/wikiScraper.js";

export const getAllChampionsTool = {
  name: "lol_get_all_champions",
  description: "List all current champions with ID, name, title, roles/tags",
  inputSchema: z.object({
    patch: z.string().optional().describe("Patch version (default: latest)"),
  }),
  handler: async (args: { patch?: string }) => {
    const data = await getAllChampions(args.patch);
    const list = Object.values(data).map((c) => ({
      id: c.id,
      key: c.key,
      name: c.name,
      title: c.title,
      roles: c.tags,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(list, null, 2) }] };
  },
};

export const getChampInfo = {
  name: "lol_get_champ_info",
  description: "Get detailed champion info (stats, abilities, cooldowns, ratios, passive, skill order)",
  inputSchema: z.object({
    champion: z.string().describe("Champion name (e.g. 'Ahri', 'LeeSin')"),
    patch: z.string().optional().describe("Patch version (default: latest)"),
  }),
  handler: async (args: { champion: string; patch?: string }) => {
    const ddData = await getChampionFull(args.champion, args.patch);

    let wikiData = null;
    try {
      wikiData = await scrapeChampionWiki(args.champion);
    } catch {
      // wiki scraping is best-effort
    }

    const result = {
      name: ddData.name,
      title: ddData.title,
      roles: ddData.tags,
      stats: ddData.stats,
      difficulty: ddData.info.difficulty,
      passive: { name: ddData.passive.name, description: ddData.passive.description.replace(/<[^>]+>/g, "") },
      abilities: ddData.spells.map((s) => ({
        name: s.name,
        description: s.description.replace(/<[^>]+>/g, ""),
        cooldown: s.cooldown,
        cost: s.cost,
        range: s.range,
        resource: s.resource,
      })),
      wiki: wikiData ? {
        lore: wikiData.lore,
        range: wikiData.range,
        resource: wikiData.resource,
        releaseDate: wikiData.releaseDate,
        wikiStats: wikiData.stats,
      } : null,
    };
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
};

export const getAllItemsTool = {
  name: "lol_get_all_items",
  description: "List all items with stats, cost, build path",
  inputSchema: z.object({
    patch: z.string().optional().describe("Patch version (default: latest)"),
    group: z.string().optional().describe("Filter by tag/group"),
  }),
  handler: async (args: { patch?: string; group?: string }) => {
    const data = await getAllItems(args.patch);
    let items = Object.entries(data).map(([id, item]) => ({
      itemId: parseInt(id),
      name: item.name,
      description: item.plaintext || item.description.replace(/<[^>]+>/g, ""),
      tags: item.tags,
      cost: { total: item.gold.total, base: item.gold.base, sell: item.gold.sell },
      buildFrom: item.from || [],
      buildsInto: item.into || [],
      stats: item.stats || {},
    }));

    if (args.group) {
      items = items.filter((i) => i.tags.includes(args.group!));
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(items, null, 2) }] };
  },
};

export const getRunesTool = {
  name: "lol_get_runes",
  description: "Get rune trees with keystones, minor runes, descriptions",
  inputSchema: z.object({
    patch: z.string().optional().describe("Patch version (default: latest)"),
    group: z.string().optional().describe("Filter by tree name (Precision, Domination, Sorcery, Resolve, Inspiration)"),
  }),
  handler: async (args: { patch?: string; group?: string }) => {
    const trees = await getRunesReforged(args.patch);
    let result = trees.map((tree) => ({
      id: tree.id,
      name: tree.name,
      key: tree.key,
      slots: tree.slots.map((slot, i) => ({
        index: i,
        isKeystone: i === 0,
        runes: slot.runes.map((r) => ({
          id: r.id,
          name: r.name,
          key: r.key,
          shortDesc: r.shortDesc,
          longDesc: r.longDesc.replace(/<[^>]+>/g, ""),
        })),
      })),
    }));

    if (args.group) {
      result = result.filter((t) => t.name.toLowerCase() === args.group!.toLowerCase());
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
};
