import { z } from 'zod';
import { ulid } from 'ulid';
import { ISOTimestampSchema, ISOTimestamp } from '../../../common/timestamps.js';
import {
  OverrideReasonSchema,
  LearningScopeAppliesToSchema,
} from '../../learning-loop/shared-types.js';

/**
 * Coaching Feedback Schema
 *
 * Defines the structure for coaching feedback sent from the VS Code extension
 * to the platform when a user provides feedback on a decision or recommendation.
 * This is the extension-comms version that focuses on the communication contract,
 * referencing existing types from learning-loop schemas.
 */

// ULID regex: 26 characters, Crockford Base32
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// =============================================================================
// Branded ID Type
// =============================================================================

/** Branded type for coaching feedback IDs */
export type CoachingFeedbackId = string & { readonly __brand: 'CoachingFeedbackId' };

/** Zod schema with ULID validation for CoachingFeedbackId */
export const CoachingFeedbackIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for CoachingFeedbackId')
  .transform((val) => val as CoachingFeedbackId);

/** Generate a new CoachingFeedbackId */
export function generateCoachingFeedbackId(): CoachingFeedbackId {
  return ulid() as CoachingFeedbackId;
}

// =============================================================================
// Feedback Provider Schema
// =============================================================================

/**
 * Information about who provided the feedback.
 */
export const FeedbackProviderSchema = z.object({
  /** User ID of the feedback provider */
  userId: z.string().min(1, 'User ID is required'),

  /** Display name (optional, for UI purposes) */
  displayName: z.string().optional(),

  /** Provider type: human user or automated system */
  type: z.enum(['human', 'system']).default('human'),
});
export type FeedbackProvider = z.infer<typeof FeedbackProviderSchema>;

// =============================================================================
// Learning Scope Schema (Extension Comms version)
// =============================================================================

/**
 * Scope definition for how coaching feedback should be applied.
 * Re-uses the LearningScopeAppliesTo enum from learning-loop.
 *
 * @example
 * ```typescript
 * const scope: CoachingFeedbackScope = {
 *   appliesTo: 'this_domain',
 *   domains: ['infrastructure', 'cloud'],
 * };
 * ```
 */
export const CoachingFeedbackScopeSchema = z
  .object({
    /** How broadly this coaching applies */
    appliesTo: LearningScopeAppliesToSchema,

    /** Domain tags (required when appliesTo is 'this_domain') */
    domains: z.array(z.string().min(1)).optional(),

    /** Project identifier (relevant when appliesTo is 'this_project') */
    projectId: z.string().optional(),
  })
  .refine(
    (data) => {
      // Domain is required when appliesTo is 'this_domain'
      if (data.appliesTo === 'this_domain') {
        return data.domains !== undefined && data.domains.length > 0;
      }
      return true;
    },
    {
      message: "domains is required when appliesTo is 'this_domain'",
      path: ['domains'],
    }
  )
  .refine(
    (data) => {
      // Project ID is recommended when appliesTo is 'this_project'
      if (data.appliesTo === 'this_project') {
        return data.projectId !== undefined && data.projectId.length > 0;
      }
      return true;
    },
    {
      message: "projectId is recommended when appliesTo is 'this_project'",
      path: ['projectId'],
    }
  );

export type CoachingFeedbackScope = z.infer<typeof CoachingFeedbackScopeSchema>;

// =============================================================================
// Coaching Feedback Timestamps Schema
// =============================================================================

/**
 * Timestamps associated with coaching feedback.
 */
export const CoachingFeedbackTimestampsSchema = z.object({
  /** When the feedback was created/submitted */
  createdAt: ISOTimestampSchema,

  /** When the feedback was last updated (if applicable) */
  updatedAt: ISOTimestampSchema.optional(),

  /** When the original decision was made (for context) */
  decisionAt: ISOTimestampSchema.optional(),
});
export type CoachingFeedbackTimestamps = z.infer<typeof CoachingFeedbackTimestampsSchema>;

// =============================================================================
// Coaching Feedback Schema
// =============================================================================

/**
 * Versioned CoachingFeedback schema namespace.
 *
 * Represents coaching feedback submitted from the extension when a user
 * overrides or provides feedback on a decision.
 *
 * @example
 * ```typescript
 * const feedback = CoachingFeedback.Latest.parse({
 *   id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   decisionId: 'dec_01ARZ3NDEKTSV4RRFFQ69G5XYZ',
 *   overrideReason: 'missing_context',
 *   explanation: 'The system did not account for the new security policy',
 *   scope: { appliesTo: 'this_domain', domains: ['security'] },
 *   timestamps: { createdAt: '2024-01-15T10:30:00Z' },
 *   providedBy: { userId: 'user_123', type: 'human' },
 * });
 * ```
 */
export namespace CoachingFeedback {
  /**
   * V1: Original coaching feedback schema.
   */
  export const V1 = z.object({
    /** Unique identifier for this feedback */
    id: CoachingFeedbackIdSchema,

    /** Reference to the decision this feedback is about */
    decisionId: z.string().min(1, 'Decision ID is required'),

    /** Categorized reason for the override/feedback */
    overrideReason: OverrideReasonSchema,

    /** Free-form explanation from the user */
    explanation: z.string().optional(),

    /** How broadly this feedback should apply */
    scope: CoachingFeedbackScopeSchema,

    /** Timestamps associated with this feedback */
    timestamps: CoachingFeedbackTimestampsSchema,

    /** Information about who provided this feedback */
    providedBy: FeedbackProviderSchema,

    /** Optional metadata for extensibility */
    metadata: z.record(z.unknown()).optional(),
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

/** Backward-compatible alias for CoachingFeedback schema */
export const CoachingFeedbackSchema = CoachingFeedback.Latest;

/** Backward-compatible alias for CoachingFeedback type */
export type CoachingFeedback = CoachingFeedback.Latest;

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Parse and validate coaching feedback.
 * Throws ZodError if validation fails.
 */
export const parseCoachingFeedback = (data: unknown): CoachingFeedback =>
  CoachingFeedbackSchema.parse(data);

/**
 * Safely parse coaching feedback.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseCoachingFeedback = (data: unknown) =>
  CoachingFeedbackSchema.safeParse(data);

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new coaching feedback object with generated ID and timestamp.
 *
 * @param input - Required fields for the feedback (excluding auto-generated fields)
 * @returns A complete coaching feedback object ready for validation
 *
 * @example
 * ```typescript
 * const feedback = createCoachingFeedback({
 *   decisionId: 'dec_123',
 *   overrideReason: 'missing_context',
 *   explanation: 'Did not consider the new policy',
 *   scope: { appliesTo: 'general' },
 *   providedBy: { userId: 'user_456', type: 'human' },
 * });
 * ```
 */
export function createCoachingFeedback(
  input: Omit<CoachingFeedback, 'id' | 'timestamps'> & {
    timestamps?: Partial<CoachingFeedbackTimestamps>;
  }
): CoachingFeedback {
  const now = new Date().toISOString() as ISOTimestamp;

  return CoachingFeedbackSchema.parse({
    ...input,
    id: generateCoachingFeedbackId(),
    timestamps: {
      createdAt: now,
      ...input.timestamps,
    },
  });
}
