export interface RegionMapping {
  platform: string;
  regional: string;
}

const REGION_MAP: Record<string, RegionMapping> = {
  br: { platform: "br1", regional: "americas" },
  eune: { platform: "eun1", regional: "europe" },
  euw: { platform: "euw1", regional: "europe" },
  jp: { platform: "jp1", regional: "asia" },
  kr: { platform: "kr", regional: "asia" },
  lan: { platform: "la1", regional: "americas" },
  las: { platform: "la2", regional: "americas" },
  na: { platform: "na1", regional: "americas" },
  oce: { platform: "oc1", regional: "sea" },
  ph2: { platform: "ph2", regional: "sea" },
  ru: { platform: "ru", regional: "europe" },
  sg2: { platform: "sg2", regional: "sea" },
  th2: { platform: "th2", regional: "sea" },
  tr: { platform: "tr1", regional: "europe" },
  tw2: { platform: "tw2", regional: "sea" },
  vn2: { platform: "vn2", regional: "sea" },
};

export function getRegionMapping(region: string): RegionMapping {
  const key = region.toLowerCase();
  const mapping = REGION_MAP[key];
  if (!mapping) {
    throw new Error(
      `Unknown region "${region}". Valid regions: ${Object.keys(REGION_MAP).join(", ")}`
    );
  }
  return mapping;
}

export function getPlatformHost(platform: string): string {
  return `${platform}.api.riotgames.com`;
}

export function getRegionalHost(regional: string): string {
  return `${regional}.api.riotgames.com`;
}
