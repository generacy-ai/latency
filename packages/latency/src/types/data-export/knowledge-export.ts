import { z } from 'zod';
import { ExportVersionSchema, ExportRecordIdSchema } from './shared-types.js';

/**
 * Knowledge Export Schema
 *
 * Defines schemas for exporting the four layers of individual knowledge:
 * - Philosophy: Core values, meta-preferences, boundaries
 * - Principles: Domain-specific validated patterns
 * - Patterns: Observed regularities (may become principles)
 * - Domains: Areas of expertise/context
 *
 * References types from knowledge-store schemas but provides
 * export-friendly versions suitable for portability.
 */

// =============================================================================
// Exported Value Schema
// =============================================================================

/**
 * Core value in export format.
 */
export const ExportValueSchema = z.object({
  /** Unique identifier */
  id: ExportRecordIdSchema,

  /** Short name for the value */
  name: z.string().min(1),

  /** What this value means */
  description: z.string().min(1),

  /** Relative importance (0-1) */
  weight: z.number().min(0).max(1),

  /** Value IDs this trades off against */
  inTensionWith: z.array(ExportRecordIdSchema).optional(),
});
export type ExportValue = z.infer<typeof ExportValueSchema>;

// =============================================================================
// Exported Boundary Schema
// =============================================================================

/**
 * Hard limit or boundary in export format.
 */
export const ExportBoundarySchema = z.object({
  /** Unique identifier */
  id: ExportRecordIdSchema,

  /** The boundary statement */
  description: z.string().min(1),

  /** Whether this is absolute or contextual */
  type: z.enum(['absolute', 'contextual']),

  /** When it applies (if contextual) */
  context: z.string().optional(),
});
export type ExportBoundary = z.infer<typeof ExportBoundarySchema>;

// =============================================================================
// Exported Meta-Preference Schema
// =============================================================================

/**
 * Meta-preference (preference about preferences) in export format.
 */
export const ExportMetaPreferenceSchema = z.object({
  /** Unique identifier */
  id: ExportRecordIdSchema,

  /** Category (e.g., 'decision_style') */
  category: z.string().min(1),

  /** The meta-preference statement */
  preference: z.string().min(1),

  /** Strength of preference (0-1) */
  strength: z.number().min(0).max(1),
});
export type ExportMetaPreference = z.infer<typeof ExportMetaPreferenceSchema>;

// =============================================================================
// Exported Philosophy Schema
// =============================================================================

/**
 * Complete philosophy layer in export format.
 */
export const ExportPhilosophySchema = z.object({
  /** Core values */
  values: z.array(ExportValueSchema),

  /** Meta-preferences */
  metaPreferences: z.array(ExportMetaPreferenceSchema),

  /** Hard limits */
  boundaries: z.array(ExportBoundarySchema),

  /** Risk profile */
  riskProfile: z.object({
    overall: z.enum(['conservative', 'moderate', 'aggressive']),
    domains: z.record(z.string(), z.enum(['conservative', 'moderate', 'aggressive'])),
    description: z.string().optional(),
  }).optional(),

  /** Time horizon preferences */
  timeHorizon: z.object({
    defaultHorizon: z.enum(['immediate', 'short', 'medium', 'long']),
    domainSpecific: z.record(z.string(), z.enum(['immediate', 'short', 'medium', 'long'])).optional(),
  }).optional(),
});
export type ExportPhilosophy = z.infer<typeof ExportPhilosophySchema>;

// =============================================================================
// Exported Principle Schema
// =============================================================================

/**
 * Domain-specific principle in export format.
 */
export const ExportPrincipleSchema = z.object({
  /** Unique identifier */
  id: ExportRecordIdSchema,

  /** Domain tags */
  domain: z.array(z.string().min(1)),

  /** The principle statement */
  statement: z.string().min(1),

  /** Why this principle exists */
  rationale: z.string().min(1),

  /** When and when not to apply */
  applicability: z.object({
    when: z.array(z.string()),
    unless: z.array(z.string()),
  }),

  /** Confidence level (0-1) */
  confidence: z.number().min(0).max(1),

  /** Reinforcement from experience (0-1) */
  learnedWeight: z.number().min(0).max(1),

  /** Status */
  status: z.enum(['active', 'deprecated', 'under_review']),

  /** Evidence count supporting this principle */
  evidenceCount: z.number().int().nonnegative().optional(),

  /** Creation timestamp */
  createdAt: z.string().datetime().optional(),
});
export type ExportPrinciple = z.infer<typeof ExportPrincipleSchema>;

// =============================================================================
// Exported Pattern Schema
// =============================================================================

/**
 * Observed pattern in export format.
 */
export const ExportPatternSchema = z.object({
  /** Unique identifier */
  id: ExportRecordIdSchema,

  /** What was observed */
  observation: z.string().min(1),

  /** Times observed */
  frequency: z.number().int().nonnegative(),

  /** Where this was observed */
  contexts: z.array(z.string().min(1)),

  /** Consistency score (0-1) */
  consistency: z.number().min(0).max(1).optional(),

  /** Status */
  status: z.enum(['observed', 'proposed_principle', 'rejected', 'promoted']),

  /** If promoted, the principle ID */
  promotedToPrincipleId: ExportRecordIdSchema.optional(),

  /** Last observation timestamp */
  lastObserved: z.string().datetime().optional(),
});
export type ExportPattern = z.infer<typeof ExportPatternSchema>;

// =============================================================================
// Domain Export Schema
// =============================================================================

/**
 * Domain/area of expertise in export format.
 */
export const ExportDomainSchema = z.object({
  /** Domain name/tag */
  name: z.string().min(1),

  /** Description of the domain */
  description: z.string().optional(),

  /** Count of principles in this domain */
  principleCount: z.number().int().nonnegative().optional(),

  /** Count of patterns in this domain */
  patternCount: z.number().int().nonnegative().optional(),

  /** Parent domain (for hierarchy) */
  parent: z.string().optional(),
});
export type ExportDomain = z.infer<typeof ExportDomainSchema>;

// =============================================================================
// Knowledge Export Schema
// =============================================================================

/**
 * Versioned KnowledgeExport schema namespace.
 *
 * Complete export of individual knowledge store.
 *
 * @example
 * ```typescript
 * const export = KnowledgeExport.Latest.parse({
 *   exportVersion: '1.0.0',
 *   exportedAt: '2024-01-15T12:00:00Z',
 *   philosophy: { values: [...], metaPreferences: [...], boundaries: [...] },
 *   principles: [{ ... }],
 *   patterns: [{ ... }],
 *   domains: [{ name: 'architecture' }, { name: 'backend' }],
 * });
 * ```
 */
export namespace KnowledgeExport {
  /**
   * V1: Original knowledge export schema.
   */
  export const V1 = z.object({
    /** Semantic version of the export format */
    exportVersion: ExportVersionSchema,

    /** ISO 8601 timestamp when the export was created */
    exportedAt: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),

    /** Philosophy layer (deepest, most stable) */
    philosophy: ExportPhilosophySchema.optional(),

    /** Validated principles */
    principles: z.array(ExportPrincipleSchema),

    /** Observed patterns */
    patterns: z.array(ExportPatternSchema),

    /** Domain definitions */
    domains: z.array(ExportDomainSchema),

    /** Statistics summary */
    statistics: z.object({
      /** Total values count */
      valuesCount: z.number().int().nonnegative().optional(),

      /** Total boundaries count */
      boundariesCount: z.number().int().nonnegative().optional(),

      /** Total principles count */
      principlesCount: z.number().int().nonnegative().optional(),

      /** Total patterns count */
      patternsCount: z.number().int().nonnegative().optional(),

      /** Patterns promoted to principles */
      promotedPatternsCount: z.number().int().nonnegative().optional(),
    }).optional(),
  });

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /** Version registry */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /** Get schema for a specific version */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for KnowledgeExport schema */
export const KnowledgeExportSchema = KnowledgeExport.Latest;

/** Backward-compatible alias for KnowledgeExport type */
export type KnowledgeExport = KnowledgeExport.Latest;

// Validation functions
export const parseKnowledgeExport = (data: unknown): KnowledgeExport =>
  KnowledgeExportSchema.parse(data);

export const safeParseKnowledgeExport = (data: unknown) =>
  KnowledgeExportSchema.safeParse(data);
