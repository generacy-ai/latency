import { describe, it, expect, vi } from 'vitest';
import { pollUntilComplete } from '../src/polling.js';
import type { PollOptions } from '../src/polling.js';

describe('pollUntilComplete', () => {
  it('returns immediately when isComplete is true on first call', async () => {
    const fn = vi.fn(async () => 'done');
    const result = await pollUntilComplete(fn, (v) => v === 'done');
    expect(result).toBe('done');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('polls until isComplete returns true', async () => {
    let count = 0;
    const fn = vi.fn(async () => ++count);
    const result = await pollUntilComplete(fn, (v) => v >= 3, {
      intervalMs: 10,
    });
    expect(result).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws on timeout', async () => {
    const fn = vi.fn(async () => 'not-done');
    await expect(
      pollUntilComplete(fn, () => false, { intervalMs: 10, timeoutMs: 50 }),
    ).rejects.toThrow('Polling timed out');
  });

  it('throws when abort signal is triggered', async () => {
    const controller = new AbortController();
    const fn = vi.fn(async () => 'pending');
    const promise = pollUntilComplete(fn, () => false, {
      intervalMs: 50,
      timeoutMs: 5000,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 30);
    await expect(promise).rejects.toThrow('Polling aborted');
  });

  it('applies exponential backoff', async () => {
    const timestamps: number[] = [];
    let count = 0;
    const fn = vi.fn(async () => {
      timestamps.push(Date.now());
      return ++count;
    });

    await pollUntilComplete(fn, (v) => v >= 4, {
      intervalMs: 20,
      backoffMultiplier: 2,
      maxIntervalMs: 500,
    });

    expect(fn).toHaveBeenCalledTimes(4);

    // Verify that delays increase between calls.
    // Expected delays: ~20ms (first interval), ~40ms (20*2), ~80ms (40*2)
    // The first timestamp is the initial call (no delay before it).
    const delays: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      delays.push(timestamps[i]! - timestamps[i - 1]!);
    }

    // Each successive delay should be roughly double the previous.
    // Use a generous threshold since real timers have jitter.
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]!).toBeGreaterThan(delays[i - 1]! * 1.3);
    }
  });

  it('caps interval at maxIntervalMs', async () => {
    const timestamps: number[] = [];
    let count = 0;
    const fn = vi.fn(async () => {
      timestamps.push(Date.now());
      return ++count;
    });

    // With intervalMs=10, backoffMultiplier=4, maxIntervalMs=30:
    // Intervals would be 10, 40, 160... but capped at 30.
    // So actual intervals: 10, 30, 30
    await pollUntilComplete(fn, (v) => v >= 4, {
      intervalMs: 10,
      backoffMultiplier: 4,
      maxIntervalMs: 30,
    });

    expect(fn).toHaveBeenCalledTimes(4);

    // Compute delays between calls
    const delays: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      delays.push(timestamps[i]! - timestamps[i - 1]!);
    }

    // The last two delays should be approximately equal (both capped at 30ms).
    // Allow generous tolerance for timer jitter.
    const lastDelay = delays[delays.length - 1]!;
    const secondLastDelay = delays[delays.length - 2]!;

    // Both should be around maxIntervalMs (30ms), not growing unbounded.
    // The second delay would be 40 without capping, so it should be ~30.
    expect(secondLastDelay).toBeLessThan(45);
    expect(lastDelay).toBeLessThan(45);

    // The capped delays should be roughly similar in magnitude.
    const ratio = Math.max(secondLastDelay, lastDelay) /
      Math.min(secondLastDelay, lastDelay);
    expect(ratio).toBeLessThan(2.5);
  });
});
