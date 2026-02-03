/**
 * Validation error for source control plugin operations.
 *
 * Thrown when input validation fails before delegating to the
 * underlying VCS implementation. Extends {@link FacetError} with
 * a fixed code of `'VALIDATION_ERROR'`.
 *
 * @example
 * ```typescript
 * try {
 *   await plugin.commit({ message: '', files: [] });
 * } catch (err) {
 *   if (err instanceof ValidationError) {
 *     console.error(err.message); // "Commit message is required"
 *     console.error(err.code);    // "VALIDATION_ERROR"
 *   }
 * }
 * ```
 */
import { FacetError } from '@generacy-ai/latency';

export class ValidationError extends FacetError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
