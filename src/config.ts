import { config } from "dotenv";

config();

export const RIOT_API_KEY = process.env.RIOT_API_KEY ?? "";

let warned = false;
export function requireApiKey(): string {
  if (!RIOT_API_KEY && !warned) {
    console.error("RIOT_API_KEY is not set in .env");
    warned = true;
  }
  return RIOT_API_KEY;
}
