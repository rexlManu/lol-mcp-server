# AGENTS.md

## Project Overview

TypeScript MCP (Model Context Protocol) server exposing 35 tools for League of Legends player analysis, match review, and training-plan generation. Uses Riot API for live data, Data Dragon for static game data, and Lolalytics/League Wiki scraping for builds and meta.

**Key technologies:** TypeScript (strict), Node.js 20+, `@modelcontextprotocol/sdk`, zod, cheerio, vitest, pnpm.

## Setup Commands

```bash
pnpm install
cp .env.example .env   # Add RIOT_API_KEY=your_key
```

Riot API key: https://developer.riotgames.com/ (free dev key works).

## Development Workflow

- Dev server: `pnpm dev` (tsx, hot-reload via stdio)
- Type check: `pnpm typecheck`
- Build: `pnpm build` (output: `dist/`)
- Don't run `pnpm dev` — assume it's already running if needed.

## Testing Instructions

**Unit tests (no API key required, run on CI):**
```bash
pnpm test
```
Excludes `tests/tools.test.ts` by default. These are pure logic tests: regions, cache, analysis engines, lolalytics parser, tool schema validation.

**Integration tests (require `RIOT_API_KEY` in `.env`):**
```bash
pnpm test:integration
```
Tests all 35 tools against the real Riot API using account `Justice Is Dead#LOTM` on EUW and champion Jinx. Never run these on CI — they need a valid API key and network access.

**Test files:**
- `tests/regions.test.ts` — Region routing maps
- `tests/cache.test.ts` — TTL cache
- `tests/analysis.test.ts` — Performance/champion analysis engines (mocked matches)
- `tests/lolalytics-parser.test.ts` — HTML parser
- `tests/review-tools.test.ts` — Review tool schemas
- `tests/tools.test.ts` — Integration tests (excluded from CI)

**Global timeout:** 10s per test (see `vitest.config.ts`).

**Before committing:** Always run `pnpm typecheck && pnpm test && pnpm build`.

## Code Style

- **TypeScript strict mode** — no `any` unless 100% necessary
- **ESM modules** (`"type": "module"`) — all imports use `.js` extensions
- **zod v3** for all MCP tool input validation (not v4 — breaking changes)
- **camelCase** for functions/variables, **PascalCase** for types/interfaces
- **No comments** unless explicitly requested
- Tool naming: `lol_get_*`, `lol_analyze_*`, `lol_compare_*`
- File org: `src/tools/` (MCP tools), `src/riot/` (API client), `src/analysis/` (engines), `src/static-data/`, `src/lolalytics/`, `src/cache/`

## Adding a New MCP Tool

1. Create tool in `src/tools/` following existing pattern:
```typescript
export const myTool = {
  name: "lol_my_tool",
  description: "What it does",
  inputSchema: z.object({ /* zod fields */ }),
  handler: async (args) => {
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
};
```
2. Register in `src/index.ts` — add to `tools` array
3. Add unit test in `tests/`
4. Update `README.md` tool table

## Architecture

**Region routing:** User-facing regions (`euw`, `na`, `kr`, etc.) map to platform (`euw1`, `na1`) and regional (`europe`, `americas`, `asia`, `sea`) hosts. Account/Match/Timeline APIs use regional routing; Summoner/League/Clash use platform. See `src/riot/regions.ts`.

**Riot API client:** `src/riot/client.ts` — native `fetch` with `X-Riot-Token` header, 10s request timeout (AbortController), automatic 429 retry with `Retry-After`, typed errors (404/403/401/5xx). Use `getRegional()` and `getPlatform()` helpers — never bypass.

**Caching:** `src/cache/cache.ts` — in-memory TTL cache. TTLs: live game 15s, server status 30s, account/summoner/ranked 60s, mastery/history 120s, Lolalytics 5min, match details/timeline 1h, static data 24h. Always cache Riot API responses and scraped pages.

**Scraping:** Lolalytics (`src/lolalytics/`) uses cheerio. Selectors isolated in `parser.ts`. If parsing fails, throw `ScrapeLayoutChangedError` — tools catch this and return `scrape_layout_changed` error to caller.

**Config:** `src/config.ts` — lazy API key check via `requireApiKey()`. Does NOT crash on missing key (so unit tests pass without `.env`). Key only needed at runtime when making real API calls.

## Build and Deployment

- **Build:** `pnpm build` → `dist/` (compiled JS + `.d.ts` + sourcemaps)
- **npm package:** `@rexlmanu/lol-mcp-server` (scoped, public)
- **Binary:** `lol-mcp-server` (shebang in `src/index.ts`)
- **Node engine:** `>=20.0.0`

**CI/CD (`.github/workflows/`):**
- `ci.yml` — runs on push/PR to main. Typecheck + unit tests (no API key) + build. Matrix: Node 20, 22.
- `release.yml` — runs on `v*` tags. Typecheck + unit tests + build + `npm publish --provenance` via Trusted Publisher (environment: `npm`) + GitHub Release.
- `dependabot-automerge.yml` — auto-merges patch/minor dep bumps.

**Release process:**
1. Ensure `pnpm typecheck && pnpm test && pnpm build` all pass
2. Bump version: `npm version <version> --no-git-tag-version`
3. Commit: `git commit -m "chore: release <version>"`
4. Tag: `git tag -a v<version> -m "v<version> - <description>"`
5. Push: `git push origin main && git push origin v<version>`
6. Release workflow auto-publishes to npm and creates GitHub Release

**Trusted Publisher:** npm package configured with OIDC Trusted Publisher (repo: `rexlManu/lol-mcp-server`, workflow: `release.yml`, environment: `npm`). No `NPM_TOKEN` secret needed. First version of a package must be published manually before Trusted Publisher works.

## Security Considerations

- **Never commit `.env`** — it's gitignored
- **Never hardcode API keys** — use `requireApiKey()` from `src/config.ts`
- Riot dev API keys expire after 24h — rotate regularly
- Lolalytics scraping uses a browser User-Agent header — respect rate limits

## Pull Request Guidelines

- Title format: `type: description` (e.g., `feat: add death timeline tool`, `fix: champion filter`)
- Required checks before submitting: `pnpm typecheck`, `pnpm test`, `pnpm build`
- Integration tests (`pnpm test:integration`) are optional — only if you have a valid API key
- Update `README.md` tool table when adding/modifying tools
- Add unit tests for new logic — keep `tests/tools.test.ts` excluded from CI

## Common Gotchas

- **Riot summoner API** no longer returns `id`/`accountId` for some accounts — use `puuid`-based endpoints instead of `summonerId`-based ones
- **Riot API 503s** happen intermittently — integration tests handle this gracefully
- **zod v3 only** — v4 has breaking API changes, don't upgrade without migration
- **ESM imports** — always use `.js` extension in imports (TypeScript compiles to ESM)
- **Lolalytics URL** — uses `/lol/<champion>/build/` pattern (lowercase, no spaces)
- **`dist/` leftover files** — old tool files may remain after renames; rebuild cleans them
