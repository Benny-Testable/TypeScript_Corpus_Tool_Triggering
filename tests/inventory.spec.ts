import { describe, expect, it } from "vitest";
import { InMemoryStockStore, InsufficientStockError, InventoryService } from "../src/services/inventory";

function service(levels: Record<string, number>): InventoryService {
  return new InventoryService(new InMemoryStockStore(levels));
}

describe("InventoryService", () => {
  it("reserves part of the stock and reports what is left", async () => {
    const inventory = service({ "SKU-A": 10 });
    expect(await inventory.reserve("SKU-A", 4)).toBe(6);
    expect(await inventory.available("SKU-A")).toBe(6);
  });

  it("allows reserving exactly the remaining stock", async () => {
    const inventory = service({ "SKU-A": 4 });
    expect(await inventory.reserve("SKU-A", 4)).toBe(0);
    expect(await inventory.available("SKU-A")).toBe(0);
  });

  it("treats an unknown sku as out of stock", async () => {
    const inventory = service({});
    expect(await inventory.available("SKU-Z")).toBe(0);
    await expect(inventory.reserve("SKU-Z", 1)).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it("rejects a request larger than the stock", async () => {
    const inventory = service({ "SKU-A": 3 });
    await expect(inventory.reserve("SKU-A", 5)).rejects.toThrow(/requested 5, available 3/);
    expect(await inventory.available("SKU-A")).toBe(3);
  });

  it("rejects non-positive and fractional quantities", async () => {
    const inventory = service({ "SKU-A": 3 });
    await expect(inventory.reserve("SKU-A", 0)).rejects.toBeInstanceOf(RangeError);
    await expect(inventory.reserve("SKU-A", 1.5)).rejects.toBeInstanceOf(RangeError);
  });

  it("puts earlier lines back when a later line cannot be reserved", async () => {
    const inventory = service({ "SKU-A": 10, "SKU-B": 1 });
    await expect(
      inventory.reserveAll([
        { sku: "SKU-A", quantity: 4, unitPrice: 5 },
        { sku: "SKU-B", quantity: 2, unitPrice: 5 },
      ]),
    ).rejects.toBeInstanceOf(InsufficientStockError);
    expect(await inventory.available("SKU-A")).toBe(10);
    expect(await inventory.available("SKU-B")).toBe(1);
  });

  it("reserves every line when all of them fit", async () => {
    const inventory = service({ "SKU-A": 10, "SKU-B": 5 });
    await inventory.reserveAll([
      { sku: "SKU-A", quantity: 4, unitPrice: 5 },
      { sku: "SKU-B", quantity: 2, unitPrice: 5 },
    ]);
    expect(await inventory.available("SKU-A")).toBe(6);
    expect(await inventory.available("SKU-B")).toBe(3);
  });
});
