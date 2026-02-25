import { z } from 'zod';
import { ulid } from 'ulid';
import { ErrorCategorySchema } from './error-category.js';

// ULID regex: 26 characters, Crockford Base32
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// ISO 8601 timestamp regex (simplified, allows various valid formats)
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

// Branded types for type safety
export type EventId = string & { readonly __brand: 'EventId' };

export const EventIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for EventId')
  .transform((val) => val as EventId);

/**
 * Full tool call event for internal telemetry.
 *
 * Contains complete information about a tool invocation including
 * inputs, outputs, timing, and context. Used for detailed analysis
 * and debugging.
 */
export const ToolCallEventSchema = z.object({
  /** Unique event ID in ULID format (lexicographically sortable, includes timestamp) */
  id: EventIdSchema,

  /** Schema version for forward compatibility (e.g., "1.0.0") */
  version: z.string().min(1),

  /** ISO 8601 timestamp when the event occurred */
  timestamp: z.string().regex(ISO_8601_REGEX, 'Invalid ISO 8601 timestamp format'),

  /** Agent session ID in ULID format */
  sessionId: z.string().regex(ULID_REGEX, 'Invalid ULID format for sessionId'),

  /** MCP server name */
  server: z.string().min(1),

  /** Tool name */
  tool: z.string().min(1),

  /** Tool inputs (may be omitted in anonymous mode) */
  inputs: z.record(z.unknown()),

  /** Tool outputs (may be omitted in anonymous mode) */
  outputs: z.unknown().optional(),

  /** Execution time in milliseconds */
  durationMs: z.number().int().min(0),

  /** Whether the tool call succeeded */
  success: z.boolean(),

  /** Error category for consistent aggregation */
  errorCategory: ErrorCategorySchema.optional(),

  /** Free-form error type detail */
  errorType: z.string().optional(),

  /** Error message if the call failed */
  errorMessage: z.string().optional(),

  /** Generacy workflow ID if applicable */
  workflowId: z.string().optional(),

  /** GitHub issue number if applicable */
  issueNumber: z.number().int().positive().optional(),

  /** Workflow phase if applicable */
  phase: z.string().optional(),
});

export type ToolCallEvent = z.infer<typeof ToolCallEventSchema>;

/** Generate a new event ID */
export function generateEventId(): EventId {
  return ulid() as EventId;
}
