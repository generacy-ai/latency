import { z } from 'zod';
import { UrgencySchema } from '../../common/urgency.js';
import {
  DecisionRequestIdSchema,
  DecisionOptionIdSchema,
  DecisionDomainSchema,
  RelatedEntitySchema,
} from './shared-types.js';
import { TimestampSchema } from '../knowledge-store/shared-types.js';

/**
 * Three-Layer Decision Request schemas.
 * Defines the initial request for a decision including context, options, and urgency.
 * Note: Uses 'ThreeLayer' prefix to avoid conflict with agency-humancy DecisionRequest.
 */

// =============================================================================
// Decision Context
// =============================================================================

/**
 * Structured context passed with each decision request.
 */
export const ThreeLayerDecisionContextSchema = z
  .object({
    /** Brief description of the decision context */
    summary: z.string().min(1),
    /** Domain tags for categorization */
    domain: z.array(z.string()),
    /** Active constraints affecting the decision */
    constraints: z.array(z.string()),
    /** People affected by the decision */
    stakeholders: z.array(z.string()),
    /** Time sensitivity information */
    timeline: z.string().optional(),
    /** Detailed context for human presentation */
    expandedContext: z.string().optional(),
  })
  .passthrough();

export type ThreeLayerDecisionContext = z.infer<typeof ThreeLayerDecisionContextSchema>;

export const parseThreeLayerDecisionContext = (data: unknown): ThreeLayerDecisionContext =>
  ThreeLayerDecisionContextSchema.parse(data);

export const safeParseThreeLayerDecisionContext = (data: unknown) =>
  ThreeLayerDecisionContextSchema.safeParse(data);

// =============================================================================
// Tradeoffs
// =============================================================================

/**
 * Tradeoffs structure for decision options.
 */
export const TradeoffsSchema = z
  .object({
    /** Benefits of this option */
    pros: z.array(z.string()),
    /** Drawbacks of this option */
    cons: z.array(z.string()),
  })
  .passthrough();

export type Tradeoffs = z.infer<typeof TradeoffsSchema>;

// =============================================================================
// Decision Option
// =============================================================================

/**
 * A single decision option with tradeoffs analysis.
 * Note: Uses 'ThreeLayer' prefix to avoid conflict with agency-humancy DecisionOption.
 */
export const ThreeLayerDecisionOptionSchema = z
  .object({
    /** Unique identifier for this option */
    id: DecisionOptionIdSchema,
    /** Short label for the option */
    label: z.string().min(1),
    /** Full description of the option */
    description: z.string().min(1),
    /** Pros and cons analysis */
    tradeoffs: TradeoffsSchema,
  })
  .passthrough();

export type ThreeLayerDecisionOption = z.infer<typeof ThreeLayerDecisionOptionSchema>;

export const parseThreeLayerDecisionOption = (data: unknown): ThreeLayerDecisionOption =>
  ThreeLayerDecisionOptionSchema.parse(data);

export const safeParseThreeLayerDecisionOption = (data: unknown) =>
  ThreeLayerDecisionOptionSchema.safeParse(data);

// =============================================================================
// Decision Request
// =============================================================================

/**
 * The initial request for a decision in the three-layer model.
 * Contains context, available options, and urgency level.
 * Note: Uses 'ThreeLayer' prefix to avoid conflict with agency-humancy DecisionRequest.
 */
export const ThreeLayerDecisionRequestSchema = z
  .object({
    /** Unique identifier for this request */
    id: DecisionRequestIdSchema,
    /** When the request was created */
    timestamp: TimestampSchema,
    /** Domain category for the decision */
    domain: DecisionDomainSchema,
    /** Structured context information */
    context: ThreeLayerDecisionContextSchema,
    /** The decision question to be answered */
    question: z.string().min(1),
    /** Available choices (minimum 2) */
    options: z.array(ThreeLayerDecisionOptionSchema).min(2),
    /** How urgent is this decision */
    urgency: UrgencySchema,
    /** Related entities (issues, PRs, files) */
    relatedEntities: z.array(RelatedEntitySchema),
  })
  .passthrough();

export type ThreeLayerDecisionRequest = z.infer<typeof ThreeLayerDecisionRequestSchema>;

export const parseThreeLayerDecisionRequest = (data: unknown): ThreeLayerDecisionRequest =>
  ThreeLayerDecisionRequestSchema.parse(data);

export const safeParseThreeLayerDecisionRequest = (data: unknown) =>
  ThreeLayerDecisionRequestSchema.safeParse(data);
