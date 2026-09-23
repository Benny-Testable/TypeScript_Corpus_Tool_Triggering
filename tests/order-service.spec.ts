import { describe, expect, it } from "vitest";
import { OrderService } from "../src/services/order-service";
import type { OrderRecord } from "../src/models/order-record";

function order(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "ORD-1", channel: "retail", tier: "standard",
    lines: [{ sku: "SKU-A", quantity: 2, unitPrice: 50 }],
    placedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("OrderService", () => {
  it("prices a simple retail order with tax", () => {
    const priced = new OrderService().price(order());
    expect(priced.subtotal).toBe(100);
    expect(priced.discount).toBe(0);
    expect(priced.tax).toBe(8.25);
    expect(priced.total).toBe(108.25);
  });

  it("applies the gold tier discount", () => {
    const priced = new OrderService().price(order({ tier: "gold" }));
    expect(priced.discount).toBe(15);
    expect(priced.total).toBe(92.01);
  });

  it("adds a volume bonus above 25 units", () => {
    const priced = new OrderService().price(
      order({ tier: "standard", lines: [{ sku: "SKU-B", quantity: 30, unitPrice: 10 }] }),
    );
    expect(priced.subtotal).toBe(300);
    expect(priced.discount).toBe(3);
  });

  it("charges no tax on the partner channel", () => {
    const priced = new OrderService().price(order({ channel: "partner" }));
    expect(priced.tax).toBe(0);
    expect(priced.total).toBe(100);
  });

  it("rejects a non-positive quantity", () => {
    const bad = order({ lines: [{ sku: "SKU-X", quantity: 0, unitPrice: 10 }] });
    expect(() => new OrderService().price(bad)).toThrow(/quantity must be a positive whole number/);
  });

  it("rejects NaN and fractional quantities", () => {
    for (const quantity of [Number.NaN, 1.5]) {
      const bad = order({ lines: [{ sku: "SKU-X", quantity, unitPrice: 10 }] });
      expect(() => new OrderService().price(bad)).toThrow(/positive whole number/);
    }
  });

  it("rejects negative and non-finite unit prices", () => {
    for (const unitPrice of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const bad = order({ lines: [{ sku: "SKU-X", quantity: 1, unitPrice }] });
      expect(() => new OrderService().price(bad)).toThrow(/non-negative number/);
    }
  });

  it("rejects an order with no lines", () => {
    expect(() => new OrderService().price(order({ lines: [] }))).toThrow(/at least one line/);
  });

  it("collects failures instead of throwing in priceAll", () => {
    const result = new OrderService().priceAll([
      order({ id: "GOOD-1" }),
      order({ id: "BAD-1", lines: [{ sku: "SKU-Y", quantity: -1, unitPrice: 5 }] }),
    ]);
    expect(result.priced).toHaveLength(1);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.field).toBe("quantity");
  });

  it("counts processed orders", () => {
    const service = new OrderService();
    service.price(order({ id: "A" }));
    service.price(order({ id: "B" }));
    expect(service.processedCount).toBe(2);
  });
});
