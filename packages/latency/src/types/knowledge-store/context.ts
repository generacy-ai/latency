import { z } from 'zod';
import {
  UserContextIdSchema,
  PriorityIdSchema,
  ChangeIdSchema,
  UserIdSchema,
  TimestampSchema,
  OptionalTimestampSchema,
  EnergyLevelSchema,
  ImportanceLevelSchema,
  ImpactLevelSchema,
  SeverityLevelSchema,
  ConstraintTypeSchema,
  PercentageSchema,
} from './shared-types.js';

/**
 * Context Layer Schemas
 *
 * Current situation dynamics that affect decision-making.
 * This is the shallowest, most volatile layer.
 */

// =============================================================================
// Priority Schema
// =============================================================================

/**
 * A current priority with importance level.
 *
 * @example
 * ```typescript
 * const priority: Priority = {
 *   id: 'pty_abc12345',
 *   description: 'Ship MVP by end of Q4',
 *   importance: 'critical',
 *   deadline: new Date('2024-12-31'),
 * };
 * ```
 */
export const PrioritySchema = z
  .object({
    /** Unique identifier with pty_ prefix */
    id: PriorityIdSchema,
    /** Description of the priority */
    description: z.string().min(1),
    /** Importance level */
    importance: ImportanceLevelSchema,
    /** Optional deadline */
    deadline: OptionalTimestampSchema,
  })
  .passthrough();

export type Priority = z.infer<typeof PrioritySchema>;

// =============================================================================
// Constraint Schema
// =============================================================================

/**
 * A constraint affecting decisions.
 *
 * @example
 * ```typescript
 * const constraint: Constraint = {
 *   type: 'budget',
 *   description: 'Limited to $10k for infrastructure',
 *   severity: 'hard',
 * };
 * ```
 */
export const ConstraintSchema = z
  .object({
    /** Type of constraint */
    type: ConstraintTypeSchema,
    /** Description of the constraint */
    description: z.string().min(1),
    /** Whether this is a hard or soft constraint */
    severity: SeverityLevelSchema,
  })
  .passthrough();

export type Constraint = z.infer<typeof ConstraintSchema>;

// =============================================================================
// Change Schema
// =============================================================================

/**
 * An upcoming change that may affect decisions.
 *
 * @example
 * ```typescript
 * const change: Change = {
 *   id: 'chg_abc12345',
 *   description: 'Team expanding from 3 to 8 people',
 *   expectedDate: new Date('2024-06-01'),
 *   impact: 'high',
 *   category: 'team',
 * };
 * ```
 */
export const ChangeSchema = z
  .object({
    /** Unique identifier with chg_ prefix */
    id: ChangeIdSchema,
    /** Description of the change */
    description: z.string().min(1),
    /** When the change is expected */
    expectedDate: OptionalTimestampSchema,
    /** Impact level */
    impact: ImpactLevelSchema,
    /** Category of change */
    category: z.string().min(1),
  })
  .passthrough();

export type Change = z.infer<typeof ChangeSchema>;

// =============================================================================
// UserContext Schema
// =============================================================================

/**
 * Current situation dynamics for a user.
 *
 * @example
 * ```typescript
 * const context: UserContext = {
 *   id: 'ctx_abc12345',
 *   userId: 'user_123',
 *   currentPriorities: [{ ... }],
 *   upcomingChanges: [{ ... }],
 *   constraints: [{ ... }],
 *   energyLevel: 'medium',
 *   decisionFatigue: 45,
 *   updatedAt: new Date(),
 *   expiresAt: new Date('2024-12-31'),
 * };
 * ```
 */
export const UserContextSchema = z
  .object({
    /** Unique identifier with ctx_ prefix */
    id: UserContextIdSchema,
    /** Owner of this context */
    userId: UserIdSchema,
    /** Current priorities */
    currentPriorities: z.array(PrioritySchema),
    /** Upcoming changes */
    upcomingChanges: z.array(ChangeSchema),
    /** Current constraints */
    constraints: z.array(ConstraintSchema),
    /** Current energy level */
    energyLevel: EnergyLevelSchema,
    /** Decision fatigue (0-100) */
    decisionFatigue: PercentageSchema,
    /** Last update timestamp */
    updatedAt: TimestampSchema,
    /** When this context expires (optional) */
    expiresAt: OptionalTimestampSchema,
  })
  .passthrough();

export type UserContext = z.infer<typeof UserContextSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

export const parseUserContext = (data: unknown): UserContext =>
  UserContextSchema.parse(data);

export const safeParseUserContext = (data: unknown) =>
  UserContextSchema.safeParse(data);

export const parsePriority = (data: unknown): Priority =>
  PrioritySchema.parse(data);

export const safeParsePriority = (data: unknown) =>
  PrioritySchema.safeParse(data);

export const parseConstraint = (data: unknown): Constraint =>
  ConstraintSchema.parse(data);

export const safeParseConstraint = (data: unknown) =>
  ConstraintSchema.safeParse(data);

export const parseChange = (data: unknown): Change => ChangeSchema.parse(data);

export const safeParseChange = (data: unknown) => ChangeSchema.safeParse(data);
