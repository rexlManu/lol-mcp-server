import { config } from "dotenv";

config();

export const RIOT_API_KEY = process.env.RIOT_API_KEY ?? "";

if (!RIOT_API_KEY) {
  console.error("RIOT_API_KEY is not set in .env");
  process.exit(1);
}
