import { z } from 'zod';
import { ExtendedMetaSchema } from '../common/extended-meta.js';

/**
 * Versioned decision response schema namespace.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const response = DecisionResponse.Latest.parse({
 *   requestId: 'req-123',
 *   selectedOption: 'approve',
 *   respondedAt: '2024-01-15T10:30:00Z',
 * });
 *
 * // Use specific version
 * const v1Response = DecisionResponse.getVersion('v1').parse(data);
 * ```
 */
export namespace DecisionResponse {
  /**
   * V1: Original decision response schema.
   * At least one of selectedOption or freeformResponse should typically be provided.
   */
  export const V1 = z
    .object({
      requestId: z.string().min(1, 'Request ID is required'),
      selectedOption: z.string().min(1).optional(),
      freeformResponse: z.string().optional(),
      respondedAt: z.string().datetime({ offset: true, message: 'Must be a valid ISO 8601 datetime' }),
      respondedBy: z.string().optional(),
      meta: ExtendedMetaSchema.optional(),
    })
    .passthrough()
    .refine(
      (data) => {
        // At least one response type should be provided
        return data.selectedOption !== undefined || data.freeformResponse !== undefined;
      },
      {
        message: 'Either selectedOption or freeformResponse must be provided',
        path: ['selectedOption'],
      }
    );

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

/** Backward-compatible alias for DecisionResponse schema */
export const DecisionResponseSchema = DecisionResponse.Latest;

/** Backward-compatible alias for DecisionResponse type */
export type DecisionResponse = DecisionResponse.Latest;

// Validation functions
export const parseDecisionResponse = (data: unknown): DecisionResponse =>
  DecisionResponse.Latest.parse(data);

export const safeParseDecisionResponse = (data: unknown) =>
  DecisionResponse.Latest.safeParse(data);
