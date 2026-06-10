import { describe, it, expect, beforeEach } from "vitest";
import { getCached, setCached, clearCache, TTL } from "../src/cache/cache.js";

describe("cache", () => {
  beforeEach(() => clearCache());

  it("returns null for missing key", () => {
    expect(getCached("missing")).toBeNull();
  });

  it("stores and retrieves values", () => {
    setCached("test", { foo: "bar" }, TTL.ACCOUNT);
    expect(getCached("test")).toEqual({ foo: "bar" });
  });

  it("returns null for expired entries", () => {
    setCached("expired", "data", 1);
    const start = Date.now();
    while (Date.now() - start < 5) { /* wait */ }
    expect(getCached("expired")).toBeNull();
  });

  it("clearCache removes all entries", () => {
    setCached("a", 1, TTL.ACCOUNT);
    setCached("b", 2, TTL.ACCOUNT);
    clearCache();
    expect(getCached("a")).toBeNull();
    expect(getCached("b")).toBeNull();
  });
});
