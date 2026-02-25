import { z } from 'zod';
import { ExtendedMetaSchema } from '../../common/extended-meta.js';

/**
 * Decision type - what kind of human input is needed.
 */
export const DecisionTypeSchema = z.enum(['question', 'review', 'decision']);
export type DecisionType = z.infer<typeof DecisionTypeSchema>;

/**
 * Urgency level for decision requests.
 */
export const UrgencyLevelSchema = z.enum(['blocking_now', 'blocking_soon', 'when_available']);
export type UrgencyLevel = z.infer<typeof UrgencyLevelSchema>;

/**
 * Versioned decision option schema namespace.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const option = DecisionOption.Latest.parse({
 *   id: 'opt-1',
 *   label: 'Approve',
 * });
 *
 * // Use specific version
 * const v1Option = DecisionOption.getVersion('v1').parse(data);
 * ```
 */
export namespace DecisionOption {
  /**
   * V1: Original decision option schema.
   * Supports id, label, description, and optional meta.
   */
  export const V1 = z
    .object({
      id: z.string().min(1, 'Option ID is required'),
      label: z.string().min(1, 'Option label is required'),
      description: z.string().optional(),
      meta: ExtendedMetaSchema.optional(),
    })
    .passthrough();

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema - always point to the newest version */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /**
   * Version registry mapping version keys to their schemas.
   * Use this with getVersion() for dynamic version selection.
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

/** Backward-compatible alias for DecisionOption schema */
export const DecisionOptionSchema = DecisionOption.Latest;

/** Backward-compatible alias for DecisionOption type */
export type DecisionOption = DecisionOption.Latest;

/**
 * Versioned decision request schema namespace.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const request = DecisionRequest.Latest.parse({
 *   id: 'req-123',
 *   type: 'question',
 *   urgency: 'blocking_now',
 *   question: 'Should we proceed?',
 * });
 *
 * // Use specific version
 * const v1Request = DecisionRequest.getVersion('v1').parse(data);
 * ```
 */
export namespace DecisionRequest {
  /**
   * V1: Original decision request schema.
   * Timeout behavior: Returns a timeout error when expired.
   * Caller is responsible for deciding retry/default/escalation strategy.
   */
  export const V1 = z
    .object({
      id: z.string().min(1, 'Request ID is required'),
      type: DecisionTypeSchema,
      urgency: UrgencyLevelSchema,
      question: z.string().min(1, 'Question is required'),
      context: z.string().optional(),
      options: z.array(DecisionOption.V1).optional(),
      relatedIssue: z.number().int().positive().optional(),
      timeout: z.number().int().positive('Timeout must be positive').optional(),
      meta: ExtendedMetaSchema.optional(),
    })
    .passthrough();

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema - always point to the newest version */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /**
   * Version registry mapping version keys to their schemas.
   * Use this with getVersion() for dynamic version selection.
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

/** Backward-compatible alias for DecisionRequest schema */
export const DecisionRequestSchema = DecisionRequest.Latest;

/** Backward-compatible alias for DecisionRequest type */
export type DecisionRequest = DecisionRequest.Latest;

// Validation functions
export const parseDecisionOption = (data: unknown): DecisionOption =>
  DecisionOptionSchema.parse(data);

export const safeParseDecisionOption = (data: unknown) =>
  DecisionOptionSchema.safeParse(data);

export const parseDecisionRequest = (data: unknown): DecisionRequest =>
  DecisionRequestSchema.parse(data);

export const safeParseDecisionRequest = (data: unknown) =>
  DecisionRequestSchema.safeParse(data);
