import { describe, it, expect } from "vitest";
import { getRegionMapping } from "../src/riot/regions.js";

describe("getRegionMapping", () => {
  it("maps euw correctly", () => {
    const mapping = getRegionMapping("euw");
    expect(mapping.platform).toBe("euw1");
    expect(mapping.regional).toBe("europe");
  });

  it("maps na correctly", () => {
    const mapping = getRegionMapping("na");
    expect(mapping.platform).toBe("na1");
    expect(mapping.regional).toBe("americas");
  });

  it("maps kr correctly", () => {
    const mapping = getRegionMapping("kr");
    expect(mapping.platform).toBe("kr");
    expect(mapping.regional).toBe("asia");
  });

  it("is case insensitive", () => {
    const mapping = getRegionMapping("EUW");
    expect(mapping.platform).toBe("euw1");
    expect(mapping.regional).toBe("europe");
  });

  it("throws for unknown region", () => {
    expect(() => getRegionMapping("invalid")).toThrowError(
      'Unknown region "invalid"'
    );
  });

  it("maps all regions", () => {
    const regions = [
      "br",
      "eune",
      "euw",
      "jp",
      "kr",
      "lan",
      "las",
      "na",
      "oce",
      "ph2",
      "ru",
      "sg2",
      "th2",
      "tr",
      "tw2",
      "vn2",
    ];
    for (const region of regions) {
      const mapping = getRegionMapping(region);
      expect(mapping.platform).toBeTruthy();
      expect(mapping.regional).toBeTruthy();
    }
  });
});
