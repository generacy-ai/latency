import { z } from 'zod';

/**
 * Time windows for aggregated statistics.
 *
 * Used in ToolStats to specify the aggregation period for leaderboard data.
 */
export const TimeWindow = {
  LAST_24H: 'last_24h',
  LAST_7D: 'last_7d',
  LAST_30D: 'last_30d',
  ALL_TIME: 'all_time',
} as const;

export type TimeWindow = (typeof TimeWindow)[keyof typeof TimeWindow];

export const TimeWindowSchema = z.enum([
  'last_24h',
  'last_7d',
  'last_30d',
  'all_time',
]);
