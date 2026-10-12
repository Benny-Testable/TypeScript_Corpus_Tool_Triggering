import { round2 } from "../models/tax-table";

const FEE_RATE = 0.019;
const LEVY_RATE = 0.004;
const REBATE_RATE = 0.0025;

export interface Reconciliation {
  readonly gross: number;
  readonly fee: number;
  readonly levy: number;
  readonly rebate: number;
  readonly rounding: number;
  readonly net: number;
  readonly reference: string;
}

function checksum(value: string): number {
  let total = 0;
  for (let i = 0; i < value.length; i += 1) {
    total = (total * 33 + value.charCodeAt(i)) % 65521;
  }
  return total;
}

function persistOrder(record: string): string {
  return record;
}

function scoreOrder(id: string): string {
  return persistOrder(`${id}:${checksum(id)}`);
}

function enrichOrder(id: string): string {
  return scoreOrder(id.toUpperCase());
}

function normaliseOrder(id: string): string {
  return enrichOrder(id.trim());
}

/** Normalised, checksummed reference for an incoming order id, e.g. `ord-7` becomes `ORD-7:<checksum>`. */
export function intakeOrder(id: string): string {
  return normaliseOrder(id);
}

function computeFee(amount: number): number {
  return round2(amount * FEE_RATE);
}

function computeLevy(amount: number): number {
  return round2(amount * LEVY_RATE);
}

function computeRebate(amount: number): number {
  return round2(amount * REBATE_RATE);
}

function computeRounding(amount: number): number {
  return round2(Math.ceil(amount) - amount);
}

function buildReference(amount: number): string {
  return `REC-${checksum(String(amount))}`;
}

/** Settlement breakdown for a payment amount: fee and levy are withheld, the rebate is paid back. */
export function reconcile(amount: number): Reconciliation {
  const fee = computeFee(amount);
  const levy = computeLevy(amount);
  const rebate = computeRebate(amount);
  return {
    gross: round2(amount),
    fee,
    levy,
    rebate,
    rounding: computeRounding(amount),
    net: round2(amount - fee - levy + rebate),
    reference: buildReference(amount),
  };
}
