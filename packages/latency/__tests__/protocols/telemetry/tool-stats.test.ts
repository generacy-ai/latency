import { describe, it, expect } from 'vitest';
import { ToolStatsSchema, type ToolStats } from '../../../src/protocols/telemetry/tool-stats.js';
import { TimeWindow } from '../../../src/protocols/telemetry/time-window.js';
import { ErrorCategory } from '../../../src/protocols/telemetry/error-category.js';

describe('ToolStatsSchema', () => {
  const validStats: ToolStats = {
    version: '1.0.0',
    server: 'mcp-server-test',
    tool: 'test_tool',
    timeWindow: 'last_24h',
    totalCalls: 1000,
    successRate: 0.95,
    avgDurationMs: 150,
    p50DurationMs: 120,
    p95DurationMs: 450,
    errorBreakdown: {
      validation: 20,
      timeout: 15,
      network: 10,
      internal: 5,
    },
  };

  it('accepts valid stats with required fields', () => {
    const result = ToolStatsSchema.safeParse(validStats);
    expect(result.success).toBe(true);
  });

  it('accepts all valid time windows', () => {
    Object.values(TimeWindow).forEach((window) => {
      const result = ToolStatsSchema.safeParse({
        ...validStats,
        timeWindow: window,
      });
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid time window', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      timeWindow: 'last_1h',
    });
    expect(result.success).toBe(false);
  });

  it('accepts successRate at boundary values', () => {
    // successRate = 0 (0% success)
    const result0 = ToolStatsSchema.safeParse({
      ...validStats,
      successRate: 0,
    });
    expect(result0.success).toBe(true);

    // successRate = 1 (100% success)
    const result1 = ToolStatsSchema.safeParse({
      ...validStats,
      successRate: 1,
    });
    expect(result1.success).toBe(true);
  });

  it('rejects successRate below 0', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      successRate: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects successRate above 1', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      successRate: 1.1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty errorBreakdown', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      errorBreakdown: {},
    });
    expect(result.success).toBe(true);
  });

  it('accepts errorBreakdown with all valid categories', () => {
    const fullBreakdown = Object.values(ErrorCategory).reduce(
      (acc, cat) => ({ ...acc, [cat]: 10 }),
      {} as Record<string, number>
    );
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      errorBreakdown: fullBreakdown,
    });
    expect(result.success).toBe(true);
  });

  it('rejects errorBreakdown with invalid category', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      errorBreakdown: {
        ...validStats.errorBreakdown,
        invalid_category: 5,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative totalCalls', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      totalCalls: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer totalCalls', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      totalCalls: 1000.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative duration values', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      avgDurationMs: -1,
    });
    expect(result.success).toBe(false);

    const result2 = ToolStatsSchema.safeParse({
      ...validStats,
      p50DurationMs: -1,
    });
    expect(result2.success).toBe(false);

    const result3 = ToolStatsSchema.safeParse({
      ...validStats,
      p95DurationMs: -1,
    });
    expect(result3.success).toBe(false);
  });

  it('accepts decimal duration values', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      avgDurationMs: 150.5,
      p50DurationMs: 120.3,
      p95DurationMs: 450.7,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { version, ...statsWithoutVersion } = validStats;
    const result = ToolStatsSchema.safeParse(statsWithoutVersion);
    expect(result.success).toBe(false);
  });

  it('rejects empty server name', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      server: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty tool name', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      tool: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative error counts in breakdown', () => {
    const result = ToolStatsSchema.safeParse({
      ...validStats,
      errorBreakdown: {
        validation: -1,
      },
    });
    expect(result.success).toBe(false);
  });
});
