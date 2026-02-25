import { z } from 'zod';
import { ISOTimestampSchema } from '../../../common/timestamps.js';

/**
 * Server-Sent Events (SSE) Schema
 *
 * Defines the structure for SSE events used in real-time communication
 * between the platform and VS Code extensions. SSE is used for server-to-client
 * push notifications while REST handles client-to-server requests.
 */

// =============================================================================
// SSE Event Type Union
// =============================================================================

/**
 * All supported SSE event types.
 *
 * Decision events:
 * - decision.created: New decision added to queue
 * - decision.updated: Decision metadata changed
 * - decision.resolved: Decision has been made
 *
 * Workflow events:
 * - workflow.started: Workflow execution began
 * - workflow.step_completed: A workflow step finished
 * - workflow.completed: Workflow execution finished
 * - workflow.failed: Workflow execution failed
 * - workflow.paused: Workflow paused at breakpoint
 *
 * Coaching events:
 * - coaching.received: New coaching feedback received
 */
export const SSEEventTypeSchema = z.enum([
  // Decision events
  'decision.created',
  'decision.updated',
  'decision.resolved',

  // Workflow events
  'workflow.started',
  'workflow.step_completed',
  'workflow.completed',
  'workflow.failed',
  'workflow.paused',

  // Coaching events
  'coaching.received',
]);
export type SSEEventType = z.infer<typeof SSEEventTypeSchema>;

// =============================================================================
// Generic SSE Event Schema
// =============================================================================

/**
 * Creates a type-safe SSE event schema for a specific data payload.
 *
 * @param dataSchema - Zod schema for the event's data payload
 * @returns A Zod schema for the complete SSE event
 *
 * @example
 * ```typescript
 * const DecisionCreatedEventSchema = createSSEEventSchema(
 *   z.object({
 *     decisionId: z.string(),
 *     title: z.string(),
 *     urgency: DecisionUrgencySchema,
 *   })
 * );
 * ```
 */
export function createSSEEventSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    /** Unique event ID (for deduplication and ordering) */
    id: z.string().min(1),

    /** Event type from the SSEEventType union */
    type: SSEEventTypeSchema,

    /** Event payload - type varies by event type */
    data: dataSchema,

    /** ISO 8601 timestamp when the event was created */
    timestamp: ISOTimestampSchema,

    /** Reconnection time in milliseconds (optional, for SSE retry field) */
    retry: z.number().int().min(0).optional(),
  });
}

// =============================================================================
// Base SSE Event Schema (with unknown data)
// =============================================================================

/**
 * Versioned SSEEvent schema namespace.
 *
 * Generic SSE event wrapper for real-time updates from the platform.
 * The data field type varies based on the event type.
 *
 * @example
 * ```typescript
 * const event = SSEEvent.Latest.parse({
 *   id: 'evt_01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   type: 'decision.created',
 *   data: { decisionId: 'dec_123', title: 'API Design' },
 *   timestamp: '2024-01-15T10:30:00Z',
 *   retry: 3000,
 * });
 * ```
 */
export namespace SSEEvent {
  /**
   * V1: Original SSE event schema with generic data payload.
   */
  export const V1 = z.object({
    /** Unique event ID (for deduplication and ordering) */
    id: z.string().min(1),

    /** Event type from the SSEEventType union */
    type: SSEEventTypeSchema,

    /** Event payload - structure varies by event type */
    data: z.unknown(),

    /** ISO 8601 timestamp when the event was created */
    timestamp: ISOTimestampSchema,

    /** Reconnection time in milliseconds (optional, for SSE retry field) */
    retry: z.number().int().min(0).optional(),
  });

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema - always point to the newest version */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /**
   * Version registry mapping version keys to their schemas.
   */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /**
   * Get the schema for a specific version.
   * @param version - Version key (e.g., 'v1')
   * @returns The schema for that version
   */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for SSEEvent schema */
export const SSEEventSchema = SSEEvent.Latest;

/** Backward-compatible alias for SSEEvent type */
export type SSEEventType_Event = SSEEvent.Latest;

// =============================================================================
// Typed SSE Event Helper Type
// =============================================================================

/**
 * Helper type for creating typed SSE events.
 * Use this when you need a strongly-typed event with specific data.
 *
 * @example
 * ```typescript
 * type DecisionCreatedEvent = TypedSSEEvent<'decision.created', {
 *   decisionId: string;
 *   title: string;
 * }>;
 * ```
 */
export type TypedSSEEvent<
  TType extends SSEEventType,
  TData,
> = {
  id: string;
  type: TType;
  data: TData;
  timestamp: string;
  retry?: number;
};

// =============================================================================
// Validation Functions
// =============================================================================

export const parseSSEEvent = (data: unknown): SSEEvent.Latest =>
  SSEEventSchema.parse(data);

export const safeParseSSEEvent = (data: unknown) =>
  SSEEventSchema.safeParse(data);
