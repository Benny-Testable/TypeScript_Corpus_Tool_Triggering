import { describe, expect, it } from "vitest";
import { parseOptions, snapshot } from "../src/platform/integrations";
import { sampleOrders } from "../src/index";

describe("parseOptions", () => {
  it("uses the defaults for an empty argument list", () => {
    expect(parseOptions([])).toEqual({ channel: "retail", limit: 25, verbose: false });
  });

  it("reads channel, limit and verbose flags", () => {
    expect(parseOptions(["--channel", "wholesale", "--limit", "40", "--verbose"])).toEqual({
      channel: "wholesale",
      limit: 40,
      verbose: true,
    });
  });

  it("falls back to the default limit when the value is not a number", () => {
    expect(parseOptions(["--limit", "lots"]).limit).toBe(25);
  });

  it("rejects zero and negative limits", () => {
    expect(parseOptions(["--limit", "0"]).limit).toBe(25);
    expect(parseOptions(["--limit=-3"]).limit).toBe(25);
  });

  it("rounds a fractional limit down", () => {
    expect(parseOptions(["--limit", "7.9"]).limit).toBe(7);
  });
});

describe("snapshot", () => {
  it("returns a deep copy", () => {
    const orders = sampleOrders();
    const copy = snapshot(orders);
    expect(copy).toEqual(orders);
    expect(copy).not.toBe(orders);
    expect(copy[0]).not.toBe(orders[0]);
  });
});
