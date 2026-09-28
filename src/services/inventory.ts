import type { OrderLine } from "../models/order-record";

export interface StockStore {
  get(sku: string): Promise<number | undefined>;
  set(sku: string, quantity: number): Promise<void>;
}

export class InMemoryStockStore implements StockStore {
  private readonly levels = new Map<string, number>();

  public constructor(initial: Readonly<Record<string, number>> = {}) {
    for (const [sku, quantity] of Object.entries(initial)) {
      this.levels.set(sku, quantity);
    }
  }

  public async get(sku: string): Promise<number | undefined> {
    return this.levels.get(sku);
  }

  public async set(sku: string, quantity: number): Promise<void> {
    this.levels.set(sku, quantity);
  }
}

export class InsufficientStockError extends Error {
  public readonly sku: string;

  public constructor(sku: string, requested: number, available: number) {
    super(`not enough stock for ${sku}: requested ${requested}, available ${available}`);
    this.name = "InsufficientStockError";
    this.sku = sku;
  }
}

export class InventoryService {
  private readonly store: StockStore;

  public constructor(store: StockStore) {
    this.store = store;
  }

  public async available(sku: string): Promise<number> {
    return (await this.store.get(sku)) ?? 0;
  }

  public async reserve(sku: string, quantity: number): Promise<number> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new RangeError(`quantity must be a positive integer, got ${quantity}`);
    }
    const available = await this.available(sku);
    if (available < quantity) {
      throw new InsufficientStockError(sku, quantity, available);
    }
    const remaining = available - quantity;
    await this.store.set(sku, remaining);
    return remaining;
  }

  /** Reserve every line or none: lines reserved before a failure are put back. */
  public async reserveAll(lines: readonly OrderLine[]): Promise<void> {
    const reserved: OrderLine[] = [];
    try {
      for (const line of lines) {
        await this.reserve(line.sku, line.quantity);
        reserved.push(line);
      }
    } catch (error) {
      for (const line of reserved) {
        await this.store.set(line.sku, (await this.available(line.sku)) + line.quantity);
      }
      throw error;
    }
  }
}
