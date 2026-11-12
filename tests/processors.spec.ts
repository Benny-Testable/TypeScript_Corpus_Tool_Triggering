import { describe, expect, it } from "vitest";
import { OrderService } from "../src/services/order-service";
import { RetailOrderProcessor } from "../src/services/retail-order-processor";
import { WholesaleOrderProcessor } from "../src/services/wholesale-order-processor";
import type { OrderRecord } from "../src/models/order-record";

const BOOK: OrderRecord[] = [
  { id: "R-1", channel: "retail", tier: "gold",
    lines: [{ sku: "A", quantity: 2, unitPrice: 30 }], placedAt: "2026-02-01T00:00:00.000Z" },
  { id: "W-1", channel: "wholesale", tier: "silver",
    lines: [{ sku: "B", quantity: 120, unitPrice: 9 }], placedAt: "2026-02-01T00:00:00.000Z" },
  { id: "P-1", channel: "partner", tier: "bronze",
    lines: [{ sku: "C", quantity: 5, unitPrice: 20 }], placedAt: "2026-02-01T00:00:00.000Z" },
];

describe("channel processors", () => {
  it("retail processor takes only retail orders", () => {
    const p = new RetailOrderProcessor(new OrderService());
    expect(p.process(BOOK)).toHaveLength(1);
    expect(p.summarise().count).toBe(1);
  });

  it("wholesale processor takes only wholesale orders", () => {
    const p = new WholesaleOrderProcessor(new OrderService());
    expect(p.process(BOOK)).toHaveLength(1);
    expect(p.summarise().count).toBe(1);
  });

  it("both summarise to the same shape", () => {
    const r = new RetailOrderProcessor(new OrderService());
    const w = new WholesaleOrderProcessor(new OrderService());
    r.process(BOOK); w.process(BOOK);
    expect(Object.keys(r.summarise()).sort()).toEqual(Object.keys(w.summarise()).sort());
  });

  it("totals gross and net across accepted orders", () => {
    const p = new RetailOrderProcessor(new OrderService());
    p.process([
      { id: "R-2", channel: "retail", tier: "standard",
        lines: [{ sku: "A", quantity: 2, unitPrice: 50 }], placedAt: "2026-02-02T00:00:00.000Z" },
      { id: "R-3", channel: "retail", tier: "standard",
        lines: [{ sku: "B", quantity: 1, unitPrice: 100 }], placedAt: "2026-02-02T00:00:00.000Z" },
    ]);
    expect(p.summarise()).toEqual({ count: 2, gross: 200, net: 216.5, rejected: 0 });
  });

  it("rejects zero-value orders instead of accepting them", () => {
    const free: OrderRecord = {
      id: "R-FREE", channel: "retail", tier: "standard",
      lines: [{ sku: "GIFT", quantity: 1, unitPrice: 0 }], placedAt: "2026-02-02T00:00:00.000Z",
    };
    const retail = new RetailOrderProcessor(new OrderService());
    expect(retail.process([free])).toHaveLength(0);
    expect(retail.summarise().rejected).toBe(1);

    const wholesale = new WholesaleOrderProcessor(new OrderService());
    expect(wholesale.process([{ ...free, id: "W-FREE", channel: "wholesale" }])).toHaveLength(0);
    expect(wholesale.summarise().rejected).toBe(1);
    wholesale.reset();
    expect(wholesale.summarise()).toEqual({ count: 0, gross: 0, net: 0, rejected: 0 });
  });

  it("reset clears accumulated state", () => {
    const p = new RetailOrderProcessor(new OrderService());
    p.process(BOOK);
    p.reset();
    expect(p.summarise().count).toBe(0);
    expect(p.summarise().gross).toBe(0);
  });
});
