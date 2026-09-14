import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, isSupportedClient, loadConfig, parseIntegerEnv } from "../src/config/defaults";

describe("config", () => {
  it("parses integers and falls back on junk", () => {
    expect(parseIntegerEnv("25", 10)).toBe(25);
    expect(parseIntegerEnv(undefined, 10)).toBe(10);
    expect(parseIntegerEnv("  ", 10)).toBe(10);
    expect(parseIntegerEnv("many", 10)).toBe(10);
  });

  it("returns the defaults for an empty environment", () => {
    expect(loadConfig({})).toEqual(DEFAULT_CONFIG);
  });

  it("applies overrides from the environment", () => {
    const config = loadConfig({ ORDERKIT_BUCKET: "other", ORDERKIT_REGION: "us-east-1", ORDERKIT_PAGE_SIZE: "100" });
    expect(config.bucket).toBe("other");
    expect(config.region).toBe("us-east-1");
    expect(config.pageSize).toBe(100);
  });

  it("ignores a page size outside 1..500", () => {
    expect(loadConfig({ ORDERKIT_PAGE_SIZE: "0" }).pageSize).toBe(50);
    expect(loadConfig({ ORDERKIT_PAGE_SIZE: "501" }).pageSize).toBe(50);
    expect(loadConfig({ ORDERKIT_PAGE_SIZE: "500" }).pageSize).toBe(500);
  });

  it("checks the client version against the minimum", () => {
    expect(isSupportedClient("1.2.0")).toBe(true);
    expect(isSupportedClient("2.0.1")).toBe(true);
    expect(isSupportedClient("1.1.9")).toBe(false);
    expect(isSupportedClient("not-a-version")).toBe(false);
  });

  it("ships sample contact data on the reserved example domain", () => {
    expect(DEFAULT_CONFIG.supportEmail.endsWith("@example.com")).toBe(true);
  });
});
