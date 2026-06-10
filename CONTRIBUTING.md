# Contributing to lol-mcp-server

Thanks for your interest in contributing! This document will help you get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/rexlManu/lol-mcp-server.git
cd lol-mcp-server

# Install dependencies
pnpm install

# Copy environment file and add your Riot API key
cp .env.example .env
# Edit .env and add RIOT_API_KEY=your_key_here

# Run in dev mode
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck

# Build
pnpm build
```

## Getting a Riot API Key

1. Go to https://developer.riotgames.com/
2. Sign in with your Riot account
3. Generate a development API key
4. Add it to your `.env` file

## Adding a New MCP Tool

1. Create your tool in `src/tools/` following the existing pattern:

```typescript
import { z } from "zod";

export const myNewTool = {
  name: "lol_my_new_tool",
  description: "Description of what this tool does",
  inputSchema: z.object({
    // Define input parameters with zod
    puuid: z.string().describe("Player PUUID"),
    region: z.string().default("euw").describe("Region code"),
  }),
  handler: async (args) => {
    // Implement tool logic
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
};
```

2. Register it in `src/index.ts`:

```typescript
import { myNewTool } from "./tools/myTool.js";

// Add to the tools array
const tools = [
  // ... existing tools
  myNewTool,
];
```

3. Add tests in `tests/`

4. Update README.md with the new tool documentation

## Code Style

- TypeScript with strict mode
- Use zod for all input validation
- Follow existing naming conventions (camelCase for functions, PascalCase for types)
- Add JSDoc comments for public functions
- Keep functions small and focused

## Testing

- Write tests for new tools in `tests/`
- Use the test account "Justice Is Dead#LOTM" on EUW for integration tests
- Mock external calls where possible
- Run `pnpm test` before committing

## Caching Guidelines

- Account/summoner/ranked data: 60s TTL
- Match history: 120s TTL
- Match details/timelines: 1h TTL
- Static data (champions/items/runes): 24h TTL
- Live game: 15s TTL

## Rate Limiting

The Riot API client already handles rate limiting with automatic retries. If you're adding new API calls:

- Use the existing `getRegional` and `getPlatform` helpers
- Don't bypass the rate limiter
- Add caching where appropriate

## Pull Request Process

1. Fork the repo and create a feature branch
2. Make your changes following the guidelines above
3. Ensure all tests pass and the build succeeds
4. Update documentation if needed
5. Submit a PR with a clear description of changes
6. Wait for review and address any feedback

## Questions?

Feel free to open an issue for any questions!
