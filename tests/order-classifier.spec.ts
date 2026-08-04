import { describe, expect, it } from "vitest";
import { auditTrail, classifyOrder } from "../src/domain/order-classifier";
import type { Channel, Tier } from "../src/models/order-record";

type Case = [Channel, Tier, number, number, boolean, string, string];

const CASES: Case[] = [
  ["retail", "gold", 150, 20000, true, "us", "retail-gold-bulk-priority"],
  ["retail", "gold", 150, 20000, false, "us", "retail-gold-bulk"],
  ["retail", "gold", 150, 2000, false, "emea", "retail-gold-mid-emea"],
  ["retail", "gold", 150, 2000, false, "us", "retail-gold-mid"],
  ["retail", "gold", 150, 100, false, "us", "retail-gold-small"],
  ["retail", "gold", 20, 900, true, "us", "retail-gold-priority"],
  ["retail", "gold", 20, 400, true, "us", "retail-gold"],
  ["retail", "gold", 5, 100, false, "us", "retail-gold-minimal"],
  ["retail", "silver", 150, 6000, false, "us", "retail-silver-bulk"],
  ["retail", "silver", 150, 600, false, "us", "retail-silver-mid"],
  ["retail", "silver", 20, 600, false, "apac", "retail-silver-apac"],
  ["retail", "silver", 20, 600, false, "us", "retail-silver"],
  ["retail", "silver", 3, 60, false, "us", "retail-silver-minimal"],
  ["retail", "bronze", 60, 300, false, "us", "retail-standard-bulk"],
  ["retail", "standard", 10, 300, false, "us", "retail-standard"],
  ["wholesale", "silver", 600, 60000, true, "us", "wholesale-mega-priority"],
  ["wholesale", "silver", 600, 60000, false, "us", "wholesale-mega"],
  ["wholesale", "silver", 600, 100, false, "us", "wholesale-bulk"],
  ["wholesale", "gold", 200, 100, false, "us", "wholesale-gold"],
  ["wholesale", "bronze", 200, 100, false, "us", "wholesale-mid"],
  ["wholesale", "bronze", 20, 100, false, "us", "wholesale-small"],
  ["partner", "bronze", 200, 100, false, "emea", "partner-intl-bulk"],
  ["partner", "bronze", 20, 100, false, "apac", "partner-intl"],
  ["partner", "bronze", 200, 100, false, "us", "partner-dom-bulk"],
  ["partner", "bronze", 20, 100, false, "us", "partner-dom"],
];

describe("classifyOrder", () => {
  it.each(CASES)("%s/%s %i units, value %i, expedited=%s, region %s -> %s", (channel, tier, units, value, expedited, region, expected) => {
    expect(classifyOrder(channel, tier, units, value, expedited, region)).toBe(expected);
  });

  it("treats exactly 100 retail gold units as the mid-size band", () => {
    expect(classifyOrder("retail", "gold", 100, 20, false, "us")).toBe("retail-gold");
  });
});

describe("auditTrail", () => {
  it("stamps identity, tier, checksum, timestamp and region", () => {
    const trail = auditTrail({ id: "ORD-7", tier: "gold" });
    expect(trail).toHaveLength(5);
    expect(trail[0]).toBe("id:ORD-7");
    expect(trail[1]).toBe("tier:gold");
    expect(trail[2]).toMatch(/^sum:\d+$/);
    expect(trail[3]).toBe("ts:1970-01-01T00:00:00.000Z");
    expect(trail[4]).toBe("region:emea");
  });

  it("derives a stable checksum from the order id", () => {
    expect(auditTrail({ id: "A", tier: "bronze" })[2]).toBe(auditTrail({ id: "A", tier: "silver" })[2]);
    expect(auditTrail({ id: "A", tier: "bronze" })[2]).not.toBe(auditTrail({ id: "B", tier: "bronze" })[2]);
  });
});
