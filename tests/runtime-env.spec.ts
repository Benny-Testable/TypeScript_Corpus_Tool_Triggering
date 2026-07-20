import { describe, expect, it } from "vitest";

/** The package targets Node 22 and ES2023, so the suite checks the interpreter it runs on. */
describe("runtime environment", () => {
  it("runs on Node 22 or newer", () => {
    const major = Number(process.versions.node.split(".")[0]);
    expect(major).toBeGreaterThanOrEqual(22);
  });

  it("supports the ES2023 array helpers", () => {
    expect([1, 2, 3, 4].findLast((n) => n % 2 === 1)).toBe(3);
    expect([3, 1, 2].toSorted()).toEqual([1, 2, 3]);
    expect([1, 2, 3].toReversed()).toEqual([3, 2, 1]);
    expect([1, 2, 3].with(1, 9)).toEqual([1, 9, 3]);
  });

  it("supports optional chaining and nullish assignment", () => {
    const box: { inner?: { value?: number } } = { inner: {} };
    expect(box.inner?.value ?? 41).toBe(41);
    let counter: number | null = null;
    counter ??= 7;
    expect(counter).toBe(7);
  });

  it("supports Error cause and Object.hasOwn", () => {
    const wrapped = new Error("outer", { cause: new Error("inner") });
    expect((wrapped.cause as Error).message).toBe("inner");
    expect(Object.hasOwn({ a: 1 }, "a")).toBe(true);
  });

  it("supports Promise.any and Promise.allSettled", async () => {
    const first = await Promise.any([Promise.reject(new Error("slow")), Promise.resolve("fast")]);
    expect(first).toBe("fast");
    const results = await Promise.allSettled([Promise.resolve("ok"), Promise.reject(new Error("nope"))]);
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "rejected"]);
  });
});
