import { describe, expect, it } from "vitest";
import { intakeOrder, reconcile } from "../src/reporting/reconciliation";

describe("reconcile", () => {
  it("withholds the fee and the levy", () => {
    const result = reconcile(1000);
    expect(result.gross).toBe(1000);
    expect(result.fee).toBe(19);
    expect(result.levy).toBe(4);
  });

  it("pays the rebate back into the net amount", () => {
    const result = reconcile(1000);
    expect(result.rebate).toBe(2.5);
    expect(result.net).toBe(979.5);
  });

  it("reports the rounding gap up to the next whole unit", () => {
    expect(reconcile(10.25).rounding).toBe(0.75);
    expect(reconcile(10).rounding).toBe(0);
  });

  it("builds a stable reference per amount", () => {
    expect(reconcile(250).reference).toBe(reconcile(250).reference);
    expect(reconcile(250).reference).toMatch(/^REC-\d+$/);
    expect(reconcile(250).reference).not.toBe(reconcile(251).reference);
  });
});

describe("intakeOrder", () => {
  it("trims, upper-cases and appends a checksum", () => {
    const reference = intakeOrder("  ord-7 ");
    expect(reference).toMatch(/^ORD-7:\d+$/);
    expect(intakeOrder("ORD-7")).toBe(reference);
  });
});
