import { describe, expect, it } from "vitest";
import { chunk, groupBy, partition, sumBy, uniqueBy } from "../src/utils/collections";

describe("collections", () => {
  it("groups by key and keeps first-seen order", () => {
    const groups = groupBy(["apple", "avocado", "banana", "blueberry", "cherry"], (word) => word.charAt(0));
    expect([...groups.keys()]).toEqual(["a", "b", "c"]);
    expect(groups.get("b")).toEqual(["banana", "blueberry"]);
  });

  it("chunks into slices with a shorter tail", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });

  it("sums a derived value", () => {
    expect(sumBy([{ n: 2 }, { n: 5 }, { n: 10 }], (row) => row.n)).toBe(17);
    expect(sumBy([], () => 1)).toBe(0);
  });

  it("partitions by predicate", () => {
    expect(partition([1, 2, 3, 4, 5, 6], (n) => n % 3 === 0)).toEqual([[3, 6], [1, 2, 4, 5]]);
  });

  it("drops later duplicates", () => {
    const rows = [{ id: 1, v: "a" }, { id: 2, v: "b" }, { id: 1, v: "c" }];
    expect(uniqueBy(rows, (row) => row.id)).toEqual([{ id: 1, v: "a" }, { id: 2, v: "b" }]);
  });
});
