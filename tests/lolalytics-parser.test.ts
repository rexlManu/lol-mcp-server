import { describe, it, expect } from "vitest";
import { parseLolalyticsChampionPage, ScrapeLayoutChangedError } from "../src/lolalytics/parser.js";

describe("lolalytics parser", () => {
  it("parses basic champion page without crashing", () => {
    const html = `
      <html>
        <body>
          <div class="overview"><span class="wr">52.3%</span></div>
          <div class="roleitem"><span class="rolename">Mid</span><span class="pr">15.2%</span><span class="wr">53.1%</span></div>
          <div class="counterlist">
            <div class="counter"><img alt="Yasuo" /><span class="wr">45.2%</span><span class="pr">8.1%</span></div>
          </div>
        </body>
      </html>
    `;
    const result = parseLolalyticsChampionPage(html, "Ahri", "mid", "gold", "euw");
    expect(result.champion).toBe("Ahri");
    expect(result.lane).toBe("mid");
    expect(result.rank).toBe("gold");
    expect(result.region).toBe("euw");
  });

  it("returns empty arrays when no data found", () => {
    const html = "<html><body></body></html>";
    const result = parseLolalyticsChampionPage(html, "Test", undefined, undefined, undefined);
    expect(result.champion).toBe("Test");
    expect(result.roles).toEqual([]);
    expect(result.runes).toEqual([]);
    expect(result.counters).toEqual([]);
  });

  it("ScrapeLayoutChangedError has correct name", () => {
    const err = new ScrapeLayoutChangedError("test");
    expect(err.name).toBe("ScrapeLayoutChangedError");
    expect(err.message).toBe("test");
  });
});
