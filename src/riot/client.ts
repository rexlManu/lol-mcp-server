import { requireApiKey } from "../config.js";
import { getPlatformHost, getRegionalHost } from "./regions.js";

const RATE_LIMIT_RETRIES = 3;
const RATE_LIMIT_BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000;

export class RiotApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  retries = RATE_LIMIT_RETRIES
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "X-Riot-Token": requireApiKey() },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429 && retries > 0) {
      const retryAfter = response.headers.get("Retry-After");
      const delay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : RATE_LIMIT_BASE_DELAY_MS * (RATE_LIMIT_RETRIES - retries + 1);
      await sleep(delay);
      return fetchWithRetry(url, retries - 1);
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === "AbortError") {
      throw new RiotApiError(408, `Request timeout: ${url}`);
    }
    throw err;
  }
}

async function get<T>(host: string, path: string): Promise<T> {
  const url = `https://${host}${path}`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const body = await response.text();
    switch (response.status) {
      case 404:
        throw new RiotApiError(404, `Not found: ${path}`);
      case 403:
        throw new RiotApiError(403, `Forbidden: ${path}`);
      case 401:
        throw new RiotApiError(401, "Invalid API key");
      default:
        throw new RiotApiError(
          response.status,
          `Riot API error (${response.status}): ${body}`
        );
    }
  }

  return response.json() as Promise<T>;
}

export async function getRegional<T>(
  regional: string,
  path: string
): Promise<T> {
  return get<T>(getRegionalHost(regional), path);
}

export async function getPlatform<T>(
  platform: string,
  path: string
): Promise<T> {
  return get<T>(getPlatformHost(platform), path);
}
