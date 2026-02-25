import { z } from 'zod';
import {
  PhilosophyIdSchema,
  ValueIdSchema,
  BoundaryIdSchema,
  MetaPreferenceIdSchema,
  UserIdSchema,
  TimestampSchema,
  RiskToleranceSchema,
  TimeHorizonValueSchema,
  BoundaryTypeSchema,
  NormalizedValueSchema,
} from './shared-types.js';

/**
 * Philosophy Layer Schemas
 *
 * Core values, meta-preferences, and boundaries that define a user's
 * fundamental approach to decisions. This is the deepest, most stable
 * layer of knowledge.
 */

// =============================================================================
// Value Schema
// =============================================================================

/**
 * A core value with relative weight.
 *
 * @example
 * ```typescript
 * const value: Value = {
 *   id: 'val_abc12345',
 *   name: 'simplicity',
 *   description: 'Prefer simple solutions over complex ones',
 *   weight: 0.8,
 *   inTensionWith: ['val_flexibility1'],
 * };
 * ```
 */
export const ValueSchema = z
  .object({
    /** Unique identifier with val_ prefix */
    id: ValueIdSchema,
    /** Short name for the value (e.g., "simplicity", "flexibility") */
    name: z.string().min(1),
    /** What this value means to the user */
    description: z.string().min(1),
    /** Relative importance (0-1) */
    weight: NormalizedValueSchema,
    /** Value IDs this trades off against */
    inTensionWith: z.array(ValueIdSchema).optional(),
  })
  .passthrough();

export type Value = z.infer<typeof ValueSchema>;

// =============================================================================
// Boundary Schema
// =============================================================================

/**
 * A hard limit or ethical/practical boundary.
 *
 * @example
 * ```typescript
 * const boundary: Boundary = {
 *   id: 'bnd_abc12345',
 *   description: 'Never compromise user privacy for performance',
 *   type: 'absolute',
 * };
 * ```
 */
export const BoundarySchema = z
  .object({
    /** Unique identifier with bnd_ prefix */
    id: BoundaryIdSchema,
    /** The boundary statement */
    description: z.string().min(1),
    /** Whether this is absolute or contextual */
    type: BoundaryTypeSchema,
    /** When it applies (required if type is 'contextual') */
    context: z.string().optional(),
  })
  .passthrough()
  .refine(
    (data) => data.type !== 'contextual' || (data.context && data.context.length > 0),
    {
      message: "Context is required when boundary type is 'contextual'",
      path: ['context'],
    }
  );

export type Boundary = z.infer<typeof BoundarySchema>;

// =============================================================================
// MetaPreference Schema
// =============================================================================

/**
 * A preference about preferences (how the user prefers to make decisions).
 *
 * @example
 * ```typescript
 * const metaPref: MetaPreference = {
 *   id: 'mpf_abc12345',
 *   category: 'decision_style',
 *   preference: 'Prefer quick decisions over perfect decisions',
 *   strength: 0.7,
 * };
 * ```
 */
export const MetaPreferenceSchema = z
  .object({
    /** Unique identifier with mpf_ prefix */
    id: MetaPreferenceIdSchema,
    /** Category (e.g., 'decision_style', 'communication') */
    category: z.string().min(1),
    /** The meta-preference statement */
    preference: z.string().min(1),
    /** How strong this preference is (0-1) */
    strength: NormalizedValueSchema,
  })
  .passthrough();

export type MetaPreference = z.infer<typeof MetaPreferenceSchema>;

// =============================================================================
// RiskProfile Schema
// =============================================================================

/**
 * How the user approaches risk across different domains.
 *
 * @example
 * ```typescript
 * const riskProfile: RiskProfile = {
 *   overall: 'moderate',
 *   domains: {
 *     financial: 'conservative',
 *     technology: 'aggressive',
 *   },
 *   description: 'Generally balanced, but cautious with money',
 * };
 * ```
 */
export const RiskProfileSchema = z
  .object({
    /** Overall risk tolerance */
    overall: RiskToleranceSchema,
    /** Domain-specific risk tolerances */
    domains: z.record(z.string(), RiskToleranceSchema),
    /** Optional narrative explanation */
    description: z.string().optional(),
  })
  .passthrough();

export type RiskProfile = z.infer<typeof RiskProfileSchema>;

// =============================================================================
// TimeHorizon Schema
// =============================================================================

/**
 * Planning timeframe preferences.
 *
 * @example
 * ```typescript
 * const timeHorizon: TimeHorizon = {
 *   defaultHorizon: 'medium',
 *   domainSpecific: {
 *     career: 'long',
 *     projects: 'short',
 *   },
 * };
 * ```
 */
export const TimeHorizonSchema = z
  .object({
    /** Default planning horizon */
    defaultHorizon: TimeHorizonValueSchema,
    /** Domain-specific horizons */
    domainSpecific: z.record(z.string(), TimeHorizonValueSchema).optional(),
  })
  .passthrough();

export type TimeHorizon = z.infer<typeof TimeHorizonSchema>;

// =============================================================================
// Philosophy Schema (Aggregate)
// =============================================================================

/**
 * Complete philosophy layer for a user.
 * Contains core values, meta-preferences, boundaries, risk profile, and time horizon.
 *
 * @example
 * ```typescript
 * const philosophy: Philosophy = {
 *   id: 'phi_abc12345',
 *   userId: 'user_123',
 *   values: [{ ... }],
 *   metaPreferences: [{ ... }],
 *   boundaries: [{ ... }],
 *   riskProfile: { ... },
 *   timeHorizon: { ... },
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export const PhilosophySchema = z
  .object({
    /** Unique identifier with phi_ prefix */
    id: PhilosophyIdSchema,
    /** Owner of this philosophy */
    userId: UserIdSchema,
    /** Weighted core values */
    values: z.array(ValueSchema),
    /** Preferences about preferences */
    metaPreferences: z.array(MetaPreferenceSchema),
    /** Hard limits */
    boundaries: z.array(BoundarySchema),
    /** Risk tolerance */
    riskProfile: RiskProfileSchema,
    /** Planning timeframe preferences */
    timeHorizon: TimeHorizonSchema,
    /** Creation timestamp */
    createdAt: TimestampSchema,
    /** Last update timestamp */
    updatedAt: TimestampSchema,
  })
  .passthrough();

export type Philosophy = z.infer<typeof PhilosophySchema>;

// =============================================================================
// Parse Functions
// =============================================================================

export const parsePhilosophy = (data: unknown): Philosophy =>
  PhilosophySchema.parse(data);

export const safeParsePhilosophy = (data: unknown) =>
  PhilosophySchema.safeParse(data);

export const parseValue = (data: unknown): Value => ValueSchema.parse(data);

export const safeParseValue = (data: unknown) => ValueSchema.safeParse(data);

export const parseBoundary = (data: unknown): Boundary =>
  BoundarySchema.parse(data);

export const safeParseBoundary = (data: unknown) =>
  BoundarySchema.safeParse(data);

export const parseMetaPreference = (data: unknown): MetaPreference =>
  MetaPreferenceSchema.parse(data);

export const safeParseMetaPreference = (data: unknown) =>
  MetaPreferenceSchema.safeParse(data);

export const parseRiskProfile = (data: unknown): RiskProfile =>
  RiskProfileSchema.parse(data);

export const safeParseRiskProfile = (data: unknown) =>
  RiskProfileSchema.safeParse(data);

export const parseTimeHorizon = (data: unknown): TimeHorizon =>
  TimeHorizonSchema.parse(data);

export const safeParseTimeHorizon = (data: unknown) =>
  TimeHorizonSchema.safeParse(data);
