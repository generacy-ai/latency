import { describe, it, expect } from 'vitest';
import { TimeWindow, TimeWindowSchema } from '../../../src/protocols/telemetry/time-window.js';

describe('TimeWindow', () => {
  it('has all expected time windows', () => {
    expect(TimeWindow.LAST_24H).toBe('last_24h');
    expect(TimeWindow.LAST_7D).toBe('last_7d');
    expect(TimeWindow.LAST_30D).toBe('last_30d');
    expect(TimeWindow.ALL_TIME).toBe('all_time');
  });

  it('has exactly 4 time windows', () => {
    expect(Object.keys(TimeWindow)).toHaveLength(4);
  });
});

describe('TimeWindowSchema', () => {
  it('accepts valid time windows', () => {
    Object.values(TimeWindow).forEach((window) => {
      const result = TimeWindowSchema.safeParse(window);
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid time windows', () => {
    const result = TimeWindowSchema.safeParse('INVALID_WINDOW');
    expect(result.success).toBe(false);
  });

  it('rejects empty string', () => {
    const result = TimeWindowSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects uppercase variants', () => {
    const result = TimeWindowSchema.safeParse('LAST_24H');
    expect(result.success).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(TimeWindowSchema.safeParse(123).success).toBe(false);
    expect(TimeWindowSchema.safeParse(null).success).toBe(false);
    expect(TimeWindowSchema.safeParse(undefined).success).toBe(false);
  });
});
