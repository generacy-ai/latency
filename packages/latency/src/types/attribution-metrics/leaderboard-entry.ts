import { z } from 'zod';
import { NormalizedRateSchema, PercentileSchema, NonNegativeIntSchema } from './shared-types.js';

/**
 * LeaderboardEntry Schema
 *
 * Anonymized public metrics for competitive ranking.
 * Protects user identity while allowing comparison.
 */

// =============================================================================
// Disclosure Schema
// =============================================================================

/**
 * Optional voluntary disclosure of identity.
 * Users can choose to reveal their identity for portfolio/networking.
 */
export const DisclosedIdentitySchema = z
  .object({
    /** Display name */
    name: z.string().min(1).optional(),
    /** LinkedIn profile URL */
    linkedIn: z.string().url().optional(),
    /** Portfolio URL */
    portfolio: z.string().url().optional(),
  })
  .passthrough();

export type DisclosedIdentity = z.infer<typeof DisclosedIdentitySchema>;

// =============================================================================
// Main Schema
// =============================================================================

/**
 * Anonymized leaderboard entry for public display.
 *
 * @example
 * ```typescript
 * const entry: LeaderboardEntry = {
 *   anonymousId: 'anon_hash_abc123',
 *   domain: 'content_moderation',
 *   protegeAccuracy: 0.92,
 *   decisionsProcessed: 1250,
 *   percentile: 87.5,
 * };
 * ```
 *
 * @example with disclosure
 * ```typescript
 * const entry: LeaderboardEntry = {
 *   anonymousId: 'anon_hash_abc123',
 *   domain: 'content_moderation',
 *   protegeAccuracy: 0.92,
 *   decisionsProcessed: 1250,
 *   percentile: 87.5,
 *   disclosed: {
 *     name: 'Jane Doe',
 *     linkedIn: 'https://linkedin.com/in/janedoe',
 *   },
 * };
 * ```
 */
export const LeaderboardEntrySchema = z
  .object({
    /** Hash-based anonymous ID, consistent across periods */
    anonymousId: z.string().min(1),
    /** Domain/category for this leaderboard */
    domain: z.string().min(1),
    /** How accurate the user's protege is (0-1) */
    protegeAccuracy: NormalizedRateSchema,
    /** Total decisions processed (volume indicator) */
    decisionsProcessed: NonNegativeIntSchema,
    /** Percentile ranking (0-100) */
    percentile: PercentileSchema,
    /** Optional voluntary identity disclosure */
    disclosed: DisclosedIdentitySchema.optional(),
  })
  .passthrough();

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate DisclosedIdentity data.
 * Throws ZodError on validation failure.
 */
export const parseDisclosedIdentity = (data: unknown): DisclosedIdentity =>
  DisclosedIdentitySchema.parse(data);

/**
 * Safely parse DisclosedIdentity data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseDisclosedIdentity = (data: unknown) =>
  DisclosedIdentitySchema.safeParse(data);

/**
 * Parse and validate LeaderboardEntry data.
 * Throws ZodError on validation failure.
 */
export const parseLeaderboardEntry = (data: unknown): LeaderboardEntry =>
  LeaderboardEntrySchema.parse(data);

/**
 * Safely parse LeaderboardEntry data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseLeaderboardEntry = (data: unknown) =>
  LeaderboardEntrySchema.safeParse(data);
