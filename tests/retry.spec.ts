import { describe, expect, it } from "vitest";
import { withRetry } from "../src/utils/retry";

const noSleep = async (): Promise<void> => undefined;

describe("withRetry", () => {
  it("returns the first successful result", async () => {
    const result = await withRetry(async (attempt) => `ok-${attempt}`, { attempts: 3, baseDelayMs: 10, sleep: noSleep });
    expect(result).toBe("ok-1");
  });

  it("retries until the task succeeds", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) {
          throw new Error("flaky");
        }
        return "done";
      },
      { attempts: 5, baseDelayMs: 1, sleep: noSleep },
    );
    expect(result).toBe("done");
    expect(calls).toBe(3);
  });

  it("gives up after the configured number of attempts", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls += 1;
          throw new Error(`failure ${calls}`);
        },
        { attempts: 3, baseDelayMs: 1, sleep: noSleep },
      ),
    ).rejects.toThrow("failure 3");
    expect(calls).toBe(3);
  });

  it("waits base, then double, between attempts", async () => {
    const delays: number[] = [];
    await expect(
      withRetry(
        async () => {
          throw new Error("always");
        },
        { attempts: 4, baseDelayMs: 100, sleep: async (ms) => void delays.push(ms) },
      ),
    ).rejects.toThrow("always");
    expect(delays).toEqual([100, 200, 400]);
  });

  it("does not retry errors the predicate rejects", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls += 1;
          throw new TypeError("fatal");
        },
        { attempts: 4, baseDelayMs: 1, sleep: noSleep, shouldRetry: (error) => !(error instanceof TypeError) },
      ),
    ).rejects.toThrow("fatal");
    expect(calls).toBe(1);
  });
});
