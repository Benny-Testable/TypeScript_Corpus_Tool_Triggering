import { describe, expect, it } from "vitest";
import { discountRate, volumeBonus, effectiveRate } from "../src/services/pricing-rules";
import { taxRateFor, applyTax, round2 } from "../src/models/tax-table";

describe("pricing rules", () => {
  it("maps every tier to its rate", () => {
    expect(discountRate("gold")).toBe(0.15);
    expect(discountRate("silver")).toBe(0.08);
    expect(discountRate("bronze")).toBe(0.03);
    expect(discountRate("standard")).toBe(0);
  });

  it("steps the volume bonus at 25, 100 and 500 units", () => {
    expect(volumeBonus(24)).toBe(0);
    expect(volumeBonus(25)).toBe(0.01);
    expect(volumeBonus(100)).toBe(0.025);
    expect(volumeBonus(500)).toBe(0.05);
  });

  it("caps the combined rate at 20 percent", () => {
    expect(effectiveRate("gold", 500)).toBe(0.2);
  });

  it("knows the tax rate per channel", () => {
    expect(taxRateFor("retail")).toBe(0.0825);
    expect(taxRateFor("wholesale")).toBe(0.0625);
    expect(taxRateFor("partner")).toBe(0);
  });

  it("rounds to two places away from float error", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(applyTax(100, "retail")).toBe(8.25);
  });
});
