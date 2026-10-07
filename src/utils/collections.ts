/** Group items by the key `keyOf` returns, keeping first-seen key order. */
export function groupBy<T, K extends string>(items: readonly T[], keyOf: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}

/** Split `items` into consecutive slices of at most `size` entries. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`chunk size must be a positive integer, got ${size}`);
  }
  const slices: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    slices.push(items.slice(start, start + size));
  }
  return slices;
}

export function sumBy<T>(items: readonly T[], valueOf: (item: T) => number): number {
  let total = 0;
  for (const item of items) {
    total += valueOf(item);
  }
  return total;
}

/** Split into the items that satisfy `predicate` and the ones that do not. */
export function partition<T>(items: readonly T[], predicate: (item: T) => boolean): [T[], T[]] {
  const accepted: T[] = [];
  const rejected: T[] = [];
  for (const item of items) {
    (predicate(item) ? accepted : rejected).push(item);
  }
  return [accepted, rejected];
}

export function uniqueBy<T, K>(items: readonly T[], keyOf: (item: T) => K): T[] {
  const seen = new Set<K>();
  const unique: T[] = [];
  for (const item of items) {
    const key = keyOf(item);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }
  return unique;
}
