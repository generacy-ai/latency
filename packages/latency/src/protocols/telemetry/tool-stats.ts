import { z } from 'zod';
import { ErrorCategorySchema } from './error-category.js';
import { TimeWindowSchema } from './time-window.js';

/**
 * Aggregated tool statistics for leaderboards and dashboards.
 *
 * Contains pre-computed metrics aggregated over a time window.
 * Used for displaying tool performance comparisons.
 */
export const ToolStatsSchema = z.object({
  /** Schema version for forward compatibility (e.g., "1.0.0") */
  version: z.string().min(1),

  /** MCP server name */
  server: z.string().min(1),

  /** Tool name */
  tool: z.string().min(1),

  /** Aggregation time window */
  timeWindow: TimeWindowSchema,

  /** Total number of tool calls in the window */
  totalCalls: z.number().int().min(0),

  /** Success rate as a decimal (0.0 to 1.0) */
  successRate: z.number().min(0).max(1),

  /** Average execution time in milliseconds */
  avgDurationMs: z.number().min(0),

  /** Median (p50) execution time in milliseconds */
  p50DurationMs: z.number().min(0),

  /** 95th percentile execution time in milliseconds */
  p95DurationMs: z.number().min(0),

  /** Count of errors by category */
  errorBreakdown: z.record(ErrorCategorySchema, z.number().int().min(0)),
});

export type ToolStats = z.infer<typeof ToolStatsSchema>;
