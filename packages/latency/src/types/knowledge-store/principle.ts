import { z } from 'zod';
import {
  PrincipleIdSchema,
  EvidenceRecordIdSchema,
  UserIdSchema,
  TimestampSchema,
  PrincipleStatusSchema,
  EvidenceOutcomeSchema,
  NormalizedValueSchema,
} from './shared-types.js';

/**
 * Principle Layer Schemas
 *
 * Domain-specific decision patterns that have been validated through
 * experience. More concrete than philosophy, applied in specific contexts.
 */

// =============================================================================
// EvidenceRecord Schema
// =============================================================================

/**
 * A record of a decision that informed or validated a principle.
 *
 * @example
 * ```typescript
 * const evidence: EvidenceRecord = {
 *   id: 'evd_abc12345',
 *   decisionId: 'decision_xyz',
 *   outcome: 'confirmed',
 *   context: 'Chose simpler architecture for small team, worked well',
 *   timestamp: new Date(),
 * };
 * ```
 */
export const EvidenceRecordSchema = z
  .object({
    /** Unique identifier with evd_ prefix */
    id: EvidenceRecordIdSchema,
    /** Reference to the decision */
    decisionId: z.string().min(1),
    /** Outcome of the decision relative to the principle */
    outcome: EvidenceOutcomeSchema,
    /** Description of the context */
    context: z.string().min(1),
    /** When this evidence was recorded */
    timestamp: TimestampSchema,
  })
  .passthrough();

export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;

// =============================================================================
// Applicability Schema
// =============================================================================

/**
 * Conditions and exceptions for when a principle applies.
 *
 * @example
 * ```typescript
 * const applicability: Applicability = {
 *   when: ['team size < 5', 'tight deadline'],
 *   unless: ['external API requirements', 'regulatory compliance'],
 * };
 * ```
 */
export const ApplicabilitySchema = z
  .object({
    /** Conditions where the principle applies */
    when: z.array(z.string()),
    /** Exceptions to the principle */
    unless: z.array(z.string()),
  })
  .passthrough();

export type Applicability = z.infer<typeof ApplicabilitySchema>;

// =============================================================================
// Principle Schema
// =============================================================================

/**
 * A domain-specific decision pattern validated through experience.
 *
 * @example
 * ```typescript
 * const principle: Principle = {
 *   id: 'pri_abc12345',
 *   userId: 'user_123',
 *   domain: ['architecture', 'backend'],
 *   statement: 'Prefer fewer services unless compelling reason',
 *   rationale: 'Reduces operational complexity for small teams',
 *   applicability: {
 *     when: ['team size < 5'],
 *     unless: ['clear scaling requirements'],
 *   },
 *   evidence: [{ ... }],
 *   confidence: 0.85,
 *   learnedWeight: 0.9,
 *   status: 'active',
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export const PrincipleSchema = z
  .object({
    /** Unique identifier with pri_ prefix */
    id: PrincipleIdSchema,
    /** Owner of this principle */
    userId: UserIdSchema,
    /** Domain tags (e.g., ['architecture', 'backend']) */
    domain: z.array(z.string().min(1)),
    /** The principle statement ("Prefer X over Y when Z") */
    statement: z.string().min(1),
    /** Why this principle exists */
    rationale: z.string().min(1),
    /** When and when not to apply */
    applicability: ApplicabilitySchema,
    /** Decisions that informed this principle */
    evidence: z.array(EvidenceRecordSchema),
    /** Confidence level (0-1) */
    confidence: NormalizedValueSchema,
    /** Reinforcement from experience (0-1) */
    learnedWeight: NormalizedValueSchema,
    /** Principle IDs this may conflict with */
    conflictsWith: z.array(PrincipleIdSchema).optional(),
    /** Current status */
    status: PrincipleStatusSchema,
    /** Creation timestamp */
    createdAt: TimestampSchema,
    /** Last update timestamp */
    updatedAt: TimestampSchema,
  })
  .passthrough();

export type Principle = z.infer<typeof PrincipleSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

export const parsePrinciple = (data: unknown): Principle =>
  PrincipleSchema.parse(data);

export const safeParsePrinciple = (data: unknown) =>
  PrincipleSchema.safeParse(data);

export const parseEvidenceRecord = (data: unknown): EvidenceRecord =>
  EvidenceRecordSchema.parse(data);

export const safeParseEvidenceRecord = (data: unknown) =>
  EvidenceRecordSchema.safeParse(data);

export const parseApplicability = (data: unknown): Applicability =>
  ApplicabilitySchema.parse(data);

export const safeParseApplicability = (data: unknown) =>
  ApplicabilitySchema.safeParse(data);
