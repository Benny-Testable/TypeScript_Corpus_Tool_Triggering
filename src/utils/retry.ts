export interface RetryOptions {
  /** Total number of calls, including the first one. */
  readonly attempts: number;
  /** Delay before the first retry; it doubles after every failure. */
  readonly baseDelayMs: number;
  readonly shouldRetry?: (error: unknown) => boolean;
  readonly sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function withRetry<T>(
  task: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  const shouldRetry = options.shouldRetry ?? (() => true);
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error)) {
        throw error;
      }
      if (attempt < options.attempts) {
        await sleep(options.baseDelayMs * 2 ** (attempt - 1));
      }
    }
  }
  throw lastError;
}
