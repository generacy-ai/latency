/**
 * Status polling utility for CI/CD pipeline monitoring.
 *
 * Provides a generic {@link pollUntilComplete} function that repeatedly
 * invokes a status-fetching function until a completion predicate is
 * satisfied, with configurable interval, timeout, exponential backoff,
 * and abort signal support.
 *
 * @module polling
 */

/**
 * Configuration options for {@link pollUntilComplete}.
 */
export interface PollOptions {
  /**
   * Initial interval between polls in milliseconds.
   *
   * @defaultValue 1000
   */
  intervalMs?: number;

  /**
   * Maximum total time to poll in milliseconds.
   *
   * When exceeded, the poll rejects with an error.
   *
   * @defaultValue 300000 (5 minutes)
   */
  timeoutMs?: number;

  /**
   * Multiplier applied to the interval after each poll.
   *
   * Set to `1` for fixed-interval polling. Values greater than `1`
   * increase the delay between successive polls (exponential backoff).
   *
   * @defaultValue 1
   */
  backoffMultiplier?: number;

  /**
   * Maximum interval between polls in milliseconds.
   *
   * Caps the backoff so the interval never exceeds this value.
   *
   * @defaultValue 30000 (30 seconds)
   */
  maxIntervalMs?: number;

  /**
   * An {@link AbortSignal} that can be used to cancel polling.
   *
   * When the signal is aborted, the poll rejects with an error.
   */
  signal?: AbortSignal;
}

const DEFAULT_INTERVAL_MS = 1000;
const DEFAULT_TIMEOUT_MS = 300_000;
const DEFAULT_BACKOFF_MULTIPLIER = 1;
const DEFAULT_MAX_INTERVAL_MS = 30_000;

/**
 * Poll a function until a completion predicate is satisfied.
 *
 * Repeatedly calls `fn` to fetch the current state, then checks
 * `isComplete` to determine if polling should stop. Supports
 * configurable intervals, exponential backoff, timeouts, and
 * abort signals.
 *
 * @typeParam T - The type returned by the polling function.
 * @param fn - Async function that fetches the current state.
 * @param isComplete - Predicate that returns `true` when polling should stop.
 * @param options - Optional polling configuration.
 * @returns The final state value for which `isComplete` returned `true`.
 * @throws Error if the timeout is exceeded or the abort signal is triggered.
 *
 * @example
 * ```typescript
 * const run = await pollUntilComplete(
 *   () => cicd.getPipelineStatus(runId),
 *   (run) => run.status === 'completed' || run.status === 'failed',
 *   { intervalMs: 2000, timeoutMs: 60000, backoffMultiplier: 1.5 },
 * );
 * ```
 */
export async function pollUntilComplete<T>(
  fn: () => Promise<T>,
  isComplete: (value: T) => boolean,
  options?: PollOptions,
): Promise<T> {
  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const backoffMultiplier =
    options?.backoffMultiplier ?? DEFAULT_BACKOFF_MULTIPLIER;
  const maxIntervalMs = options?.maxIntervalMs ?? DEFAULT_MAX_INTERVAL_MS;
  const signal = options?.signal;

  const startTime = Date.now();
  let currentInterval = intervalMs;

  // Check initial state before entering the polling loop
  const initial = await fn();
  if (isComplete(initial)) {
    return initial;
  }

  while (true) {
    // Check abort signal
    if (signal?.aborted) {
      throw new Error('Polling aborted');
    }

    // Check timeout
    if (Date.now() - startTime >= timeoutMs) {
      throw new Error(`Polling timed out after ${timeoutMs}ms`);
    }

    // Wait for the current interval
    await delay(currentInterval, signal);

    // Fetch and check
    const value = await fn();
    if (isComplete(value)) {
      return value;
    }

    // Apply backoff
    currentInterval = Math.min(
      currentInterval * backoffMultiplier,
      maxIntervalMs,
    );
  }
}

/**
 * Delay for the specified duration, respecting an optional abort signal.
 */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Polling aborted'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error('Polling aborted'));
      },
      { once: true },
    );
  });
}
