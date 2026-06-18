# League of Legends MCP Server

[![npm version](https://img.shields.io/npm/v/@rexlmanu/lol-mcp-server.svg)](https://www.npmjs.com/package/@rexlmanu/lol-mcp-server)
[![CI](https://github.com/rexlManu/lol-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/rexlManu/lol-mcp-server/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server exposing 30 tools for League of Legends player analysis, match review, and training-plan generation.

## Installation

### Via npm (recommended)

```bash
npm install -g @rexlmanu/lol-mcp-server
```

### Via npx (no install)

```bash
npx @rexlmanu/lol-mcp-server
```

### From source

```bash
git clone https://github.com/rexlManu/lol-mcp-server.git
cd lol-mcp-server
pnpm install
pnpm build
```

## Setup

```bash
cp .env.example .env
# Edit .env and add your RIOT_API_KEY
```

Get your Riot API key at https://developer.riotgames.com/

## MCP Client Configuration

Add to your MCP client config (Cursor, Claude Desktop, etc.):

```json
{
  "mcpServers": {
    "league-of-legends": {
      "command": "lol-mcp-server",
      "env": {
        "RIOT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Or if installed from source:

```json
{
  "mcpServers": {
    "league-of-legends": {
      "command": "node",
      "args": ["/path/to/lol-mcp-server/dist/index.js"],
      "env": {
        "RIOT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Stack

- **Runtime:** Node.js 20+, TypeScript
- **Package manager:** pnpm
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **Validation:** zod
- **Scraping:** cheerio (Lolalytics, League Wiki)
- **Static data:** Data Dragon API
- **Testing:** vitest

```bash
pnpm dev          # Run with tsx (hot reload)
pnpm build        # Compile to dist/
pnpm start        # Run compiled server
pnpm test         # Run tests
pnpm typecheck    # Type checking
```

## MCP Client Configuration

### Cursor / VS Code

```json
{
  "mcpServers": {
    "league-of-legends": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "RIOT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### opencode

```json
{
  "mcpServers": {
    "league-of-legends": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "RIOT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Tools (30 total)

### Account & Profile (4)

| Tool | Description |
|------|-------------|
| `lol_get_account` | Get Riot account info by Riot ID |
| `lol_get_summoner` | Get summoner info (level, icon) by PUUID |
| `lol_get_ranked` | Get ranked stats (tier, rank, LP, win rate) |
| `lol_get_player_profile` | Complete player profile in one call |

### Match History (3)

| Tool | Description |
|------|-------------|
| `lol_get_match_history` | Get recent match IDs (with filters) |
| `lol_get_match_details` | Get detailed match data (batch supported) |
| `lol_get_match_timeline` | Get minute-by-minute match timeline |

### Champion & Live (4)

| Tool | Description |
|------|-------------|
| `lol_get_champion_mastery` | Get champion mastery data |
| `lol_get_live_game` | Check if player is in game |
| `lol_get_champion_rotation` | Get free champion rotation |
| `lol_get_featured_games` | Get featured games |

### League & Clash (7)

| Tool | Description |
|------|-------------|
| `lol_get_league_by_id` | Get league info by ID |
| `lol_get_league_entries` | Get league entries by summoner |
| `lol_get_league_entries_exp` | Get league entries (paginated, by queue/tier/division) |
| `lol_get_league_top` | Get top players (challenger/grandmaster/master) |
| `lol_get_clash_tournaments` | Get active Clash tournaments |
| `lol_get_clash_player` | Get Clash player info |
| `lol_get_clash_team` | Get Clash team info |

### Challenges & Status (3)

| Tool | Description |
|------|-------------|
| `lol_get_challenges` | Get all challenge configurations |
| `lol_get_player_challenges` | Get player challenge progress |
| `lol_get_server_status` | Get server status (maintenance/incidents) |

### Static Game Data (4)

| Tool | Description |
|------|-------------|
| `lol_get_all_champions` | List all champions (from Data Dragon) |
| `lol_get_champ_info` | Detailed champion info (Data Dragon + Wiki) |
| `lol_get_all_items` | List all items with stats, cost, build path |
| `lol_get_runes` | Get rune trees with keystones and descriptions |

### Lolalytics (1)

| Tool | Description |
|------|-------------|
| `lol_get_builds_for_champion` | Scrape Lolalytics for builds, runes, counters, meta |

### AI Analysis (4)

| Tool | Description |
|------|-------------|
| `lol_analyze_performance` | Analyze recent performance with recommendations |
| `lol_analyze_champion` | Analyze performance on a specific champion |
| `lol_get_improvement_tips` | Get personalized improvement tips |
| `lol_compare_players` | Compare stats between two players |

## Region Support

User-facing regions: `euw`, `eune`, `na`, `kr`, `br`, `lan`, `las`, `oce`, `ru`, `tr`, `jp`, `ph2`, `sg2`, `th2`, `tw2`, `vn2`

Platform routing: `euw1`, `eun1`, `na1`, `kr`, `jp1`, `br1`, `la1`, `la2`, `oc1`, `tr1`, `ru`

Regional routing: `europe`, `americas`, `asia`, `sea`

## Caching

| Data Type | TTL |
|-----------|-----|
| Live game / server status | 15-30s |
| Account / summoner / ranked | 60s |
| Champion mastery / match history | 2min |
| Lolalytics pages | 5min |
| Match details / timelines | 1h |
| Static data (champions/items/runes) | 24h |

## Error Handling

| Error | Description |
|-------|-------------|
| `not found` (404) | Player/match not found |
| `rate limited` (429) | Auto-retry with backoff |
| `forbidden` (403) | Private data or restricted access |
| `invalid key` (401) | Invalid Riot API key |
| `scrape_layout_changed` | Lolalytics page structure changed |
| `network failure` | Connection/API error |
| `invalid region` | Unknown region code |

## Project Structure

```
src/
  index.ts              # Entry point, MCP server setup
  config.ts             # Environment config
  riot/
    client.ts           # Riot API HTTP client with rate limiting
    regions.ts          # Region routing maps
    types.ts            # Core Riot API types
    types-extra.ts      # Additional Riot API types
  cache/
    cache.ts            # TTL-based in-memory cache
  static-data/
    dataDragon.ts       # Data Dragon API client
    wikiScraper.ts      # League Wiki scraper (cheerio)
    types.ts            # Static data types
  lolalytics/
    scraper.ts          # Lolalytics page fetcher
    parser.ts           # HTML parser (cheerio)
    types.ts            # Lolalytics types
  tools/
    account.ts          # Account, summoner, ranked, profile, match tools
    champion.ts         # Mastery, live game, rotation, featured games
    league.ts           # League, clash, challenges, status
    staticData.ts       # Champions, items, runes
    lolalytics.ts       # Lolalytics builds
    analysis.ts         # Performance analysis, tips, comparison
  analysis/
    performance.ts      # Performance analysis engine
    championReview.ts   # Champion-specific analysis
    trainingPlan.ts     # Improvement tips generator
    compare.ts          # Player comparison
tests/
  regions.test.ts       # Region mapping tests
  cache.test.ts         # Cache tests
  lolalytics-parser.test.ts  # Parser tests
  analysis.test.ts      # Analysis engine tests
```

## License

MIT
