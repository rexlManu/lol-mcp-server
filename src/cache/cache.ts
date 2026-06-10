interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearCache(): void {
  store.clear();
}

export const TTL = {
  LIVE_GAME: 15_000,
  SERVER_STATUS: 30_000,
  ACCOUNT: 60_000,
  SUMMONER: 60_000,
  RANKED: 60_000,
  MASTERY: 120_000,
  MATCH_HISTORY: 120_000,
  LOLYTICS: 300_000,
  MATCH_DETAILS: 3600_000,
  MATCH_TIMELINE: 3600_000,
  STATIC_DATA: 86400_000,
  CHALLENGES: 3600_000,
} as const;
