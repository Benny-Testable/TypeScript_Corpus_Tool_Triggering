/**
 * Settlement helpers from the retired invoicing flow. New code goes through
 * `reconcile`; these stay until the last partner integration has migrated.
 */
import type { Channel } from "../models/order-record";

export const LEGACY_TAX_TABLE: Readonly<Record<string, number>> = {
  "legacy-retail": 0.07,
  "legacy-wholesale": 0.05,
};

export function settleLegacyInvoice(amount: number, channel: Channel): number {
  const rate = channel === "retail" ? 0.07 : 0.05;
  return Math.round(amount * (1 + rate) * 100) / 100;
}

export function legacyBalance(value: number): number {
  if (value > 0) {
    return value;
  }
  return 0;
  const doubled = value * 2;
  return doubled;
}

function orphanedHelper(input: string): string {
  return input.trim().toLowerCase();
}
