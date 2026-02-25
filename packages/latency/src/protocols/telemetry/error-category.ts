import { z } from 'zod';

/**
 * Error categories for telemetry events.
 *
 * Used to classify errors in a consistent way for aggregation and analysis.
 * More granular than ErrorCode from common/errors.ts - focused on telemetry use cases.
 */
export const ErrorCategory = {
  VALIDATION: 'validation',
  TIMEOUT: 'timeout',
  PERMISSION: 'permission',
  NETWORK: 'network',
  INTERNAL: 'internal',
  UNKNOWN: 'unknown',
} as const;

export type ErrorCategory = (typeof ErrorCategory)[keyof typeof ErrorCategory];

export const ErrorCategorySchema = z.enum([
  'validation',
  'timeout',
  'permission',
  'network',
  'internal',
  'unknown',
]);
