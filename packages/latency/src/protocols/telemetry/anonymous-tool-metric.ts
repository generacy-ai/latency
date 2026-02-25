import { z } from 'zod';
import { ErrorCategorySchema } from './error-category.js';

/**
 * Privacy-preserving tool metric for public aggregation.
 *
 * This schema excludes all PII (no inputs/outputs, no session IDs, no workflow IDs).
 * Used for opt-in community benchmarks and performance comparisons.
 */
export const AnonymousToolMetricSchema = z.object({
  /** Schema version for forward compatibility (e.g., "1.0.0") */
  version: z.string().min(1),

  /** MCP server name */
  server: z.string().min(1),

  /** Tool name */
  tool: z.string().min(1),

  /** Execution time in milliseconds */
  durationMs: z.number().int().min(0),

  /** Whether the tool call succeeded */
  success: z.boolean(),

  /** Error category for consistent aggregation */
  errorCategory: ErrorCategorySchema.optional(),

  /** Free-form error type detail */
  errorType: z.string().optional(),

  /** Agent platform identifier (e.g., "claude-code", "copilot") */
  agentPlatform: z.string().optional(),

  /** Docker image or environment identifier */
  environment: z.string().optional(),
});

export type AnonymousToolMetric = z.infer<typeof AnonymousToolMetricSchema>;
