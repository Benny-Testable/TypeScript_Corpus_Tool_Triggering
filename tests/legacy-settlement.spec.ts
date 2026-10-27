import { describe, expect, it } from "vitest";
import { legacyBalance, settleLegacyInvoice } from "../src/legacy/settlement";

describe("legacy settlement", () => {
  it("adds 7 percent for retail and 5 percent otherwise", () => {
    expect(settleLegacyInvoice(100, "retail")).toBe(107);
    expect(settleLegacyInvoice(100, "wholesale")).toBe(105);
    expect(settleLegacyInvoice(19.99, "partner")).toBe(20.99);
  });

  it("never reports a negative balance", () => {
    expect(legacyBalance(12)).toBe(12);
    expect(legacyBalance(-4)).toBe(0);
  });
});
