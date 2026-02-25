import { z } from 'zod';

/**
 * Standard error codes for the generacy-ai ecosystem.
 *
 * Error Handling Patterns:
 * - Use VALIDATION_ERROR for malformed requests or invalid input
 * - Use NOT_FOUND when a requested resource doesn't exist
 * - Use UNAUTHORIZED for authentication/authorization failures
 * - Use TIMEOUT when an operation exceeds time limits
 * - Use RATE_LIMITED when request quotas are exceeded
 * - Use INTERNAL_ERROR for unexpected server-side failures
 * - Use PLUGIN_ERROR for plugin-specific failures
 * - Use NETWORK_ERROR for connectivity issues
 *
 * Retryability Guidelines:
 * - TIMEOUT, RATE_LIMITED, NETWORK_ERROR are typically retryable
 * - VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED are not retryable
 * - INTERNAL_ERROR and PLUGIN_ERROR depend on the specific error
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PLUGIN_ERROR: 'PLUGIN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PROTOCOL_NEGOTIATION_FAILED: 'PROTOCOL_NEGOTIATION_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'UNAUTHORIZED',
  'TIMEOUT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'PLUGIN_ERROR',
  'NETWORK_ERROR',
  'PROTOCOL_NEGOTIATION_FAILED',
]);

/**
 * Standard error response structure.
 *
 * @property code - The error category from ErrorCode enum
 * @property message - Human-readable error description
 * @property details - Optional additional error context (validation errors, stack traces, etc.)
 * @property retryable - Whether the client should retry the request
 * @property retryAfter - Suggested wait time in milliseconds before retrying (for RATE_LIMITED)
 */
export const ErrorResponseSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
  retryable: z.boolean(),
  retryAfter: z.number().int().min(0).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Retryable error codes
const RETRYABLE_ERROR_CODES: readonly ErrorCode[] = [
  ErrorCode.TIMEOUT,
  ErrorCode.RATE_LIMITED,
  ErrorCode.NETWORK_ERROR,
] as const;

// Helper to create error responses
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  options?: {
    details?: unknown;
    retryable?: boolean;
    retryAfter?: number;
  }
): ErrorResponse {
  const retryableByDefault = RETRYABLE_ERROR_CODES.includes(code);

  return {
    code,
    message,
    details: options?.details,
    retryable: options?.retryable ?? retryableByDefault,
    retryAfter: options?.retryAfter,
  };
}
