import { z } from 'zod';
import { ExportVersionSchema, ExportOrgIdSchema, ExportRecordIdSchema } from './shared-types.js';

/**
 * Queue State Export Schema
 *
 * Defines schemas for exporting organization-owned decision queue state,
 * including queue items and saved filters.
 *
 * This is used for org-level data backup and compliance exports.
 */

// =============================================================================
// Queue Item Export Schema
// =============================================================================

/**
 * Decision queue item for export.
 * Contains the essential queue item data without internal implementation details.
 */
export const ExportQueueItemSchema = z.object({
  /** Unique identifier */
  id: ExportRecordIdSchema,

  /** Reference to the decision request */
  decisionRequestId: ExportRecordIdSchema.optional(),

  /** Title/summary of the decision */
  title: z.string().min(1),

  /** Detailed description */
  description: z.string().optional(),

  /** Domain tags */
  domains: z.array(z.string().min(1)).min(1, 'At least one domain is required'),

  /** Urgency level */
  urgency: z.enum(['critical', 'high', 'normal', 'low']),

  /** Current status */
  status: z.enum(['pending', 'in_progress', 'resolved', 'deferred', 'expired']),

  /** User ID assigned to this item */
  assignedTo: z.string().optional(),

  /** Project ID (if project-scoped) */
  projectId: z.string().optional(),

  /** Source of the decision request */
  source: z.object({
    /** Type of source */
    type: z.enum(['manual', 'automated', 'workflow', 'external']),

    /** Reference ID */
    ref: z.string().optional(),
  }).optional(),

  /** Created timestamp */
  createdAt: z.string().datetime(),

  /** Last updated timestamp */
  updatedAt: z.string().datetime().optional(),

  /** Due date/time (if applicable) */
  dueAt: z.string().datetime().optional(),

  /** Resolution details (if resolved) */
  resolution: z.object({
    /** When resolved */
    resolvedAt: z.string().datetime(),

    /** Who resolved it */
    resolvedBy: z.string(),

    /** Chosen option ID */
    chosenOptionId: ExportRecordIdSchema.optional(),

    /** Brief notes */
    notes: z.string().optional(),
  }).optional(),

  /** Tags */
  tags: z.array(z.string()).optional(),

  /** Priority score (computed) */
  priorityScore: z.number().optional(),
});
export type ExportQueueItem = z.infer<typeof ExportQueueItemSchema>;

// =============================================================================
// Saved Filter Export Schema
// =============================================================================

/**
 * Saved queue filter for export.
 */
export const ExportSavedFilterSchema = z.object({
  /** Unique identifier */
  id: ExportRecordIdSchema,

  /** Filter name */
  name: z.string().min(1),

  /** Owner user ID */
  ownerId: z.string(),

  /** Whether shared with org */
  isShared: z.boolean(),

  /** Filter criteria */
  criteria: z.object({
    /** Project ID filter */
    projectId: z.string().optional(),

    /** Urgency level filter */
    urgency: z.array(z.enum(['critical', 'high', 'normal', 'low'])).optional(),

    /** Domain filter */
    domains: z.array(z.string()).optional(),

    /** Assigned user filter */
    assignedTo: z.string().optional(),

    /** Status filter */
    status: z.array(z.enum(['pending', 'in_progress', 'resolved', 'deferred', 'expired'])).optional(),

    /** Date range filter */
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).optional(),

    /** Tags filter */
    tags: z.array(z.string()).optional(),
  }),

  /** Created timestamp */
  createdAt: z.string().datetime().optional(),

  /** Last used timestamp */
  lastUsedAt: z.string().datetime().optional(),

  /** Use count */
  useCount: z.number().int().nonnegative().optional(),
});
export type ExportSavedFilter = z.infer<typeof ExportSavedFilterSchema>;

// =============================================================================
// Queue State Export Schema
// =============================================================================

/**
 * Versioned QueueState schema namespace.
 *
 * Complete export of organization queue state.
 *
 * @example
 * ```typescript
 * const export = QueueState.Latest.parse({
 *   exportVersion: '1.0.0',
 *   exportedAt: '2024-01-15T12:00:00Z',
 *   orgId: 'org_abc123',
 *   items: [{ ... }],
 *   filters: [{ ... }],
 * });
 * ```
 */
export namespace QueueState {
  /**
   * V1: Original queue state export schema.
   */
  export const V1 = z.object({
    /** Semantic version of the export format */
    exportVersion: ExportVersionSchema,

    /** ISO 8601 timestamp when the export was created */
    exportedAt: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),

    /** Organization ID this export belongs to */
    orgId: ExportOrgIdSchema,

    /** Queue items */
    items: z.array(ExportQueueItemSchema),

    /** Saved filters */
    filters: z.array(ExportSavedFilterSchema),

    /** Export options */
    exportOptions: z.object({
      /** Include resolved items */
      includeResolved: z.boolean().optional(),

      /** Item date range filter */
      itemDateRange: z.object({
        from: z.string().datetime(),
        to: z.string().datetime(),
      }).optional(),

      /** Status filter applied */
      statusFilter: z.array(z.string()).optional(),
    }).optional(),

    /** Statistics summary */
    statistics: z.object({
      /** Total item count in export */
      itemCount: z.number().int().nonnegative(),

      /** Items by status */
      itemsByStatus: z.record(z.string(), z.number().int().nonnegative()).optional(),

      /** Items by urgency */
      itemsByUrgency: z.record(z.string(), z.number().int().nonnegative()).optional(),

      /** Items by domain */
      itemsByDomain: z.record(z.string(), z.number().int().nonnegative()).optional(),

      /** Filter count */
      filterCount: z.number().int().nonnegative(),

      /** Shared filter count */
      sharedFilterCount: z.number().int().nonnegative().optional(),

      /** Average resolution time (ms) */
      avgResolutionTimeMs: z.number().nonnegative().optional(),
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

/** Backward-compatible alias for QueueState schema */
export const QueueStateSchema = QueueState.Latest;

/** Backward-compatible alias for QueueState type */
export type QueueState = QueueState.Latest;

// Validation functions
export const parseQueueState = (data: unknown): QueueState =>
  QueueStateSchema.parse(data);

export const safeParseQueueState = (data: unknown) =>
  QueueStateSchema.safeParse(data);
