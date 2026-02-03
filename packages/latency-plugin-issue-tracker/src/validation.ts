import { FacetError } from '@generacy-ai/latency';

/**
 * Error thrown when input validation fails in issue tracker operations.
 *
 * Extends {@link FacetError} with a fixed code of `'VALIDATION'`, supporting
 * both `instanceof ValidationError` and `error.code === 'VALIDATION'` checks.
 *
 * @example
 * ```typescript
 * throw new ValidationError('Issue title is required');
 * ```
 *
 * @example
 * ```typescript
 * try {
 *   await tracker.createIssue({ title: '' });
 * } catch (err) {
 *   if (err instanceof ValidationError) {
 *     console.error('Validation failed:', err.message);
 *   }
 * }
 * ```
 */
export class ValidationError extends FacetError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, 'VALIDATION', options);
    this.name = 'ValidationError';
  }
}
