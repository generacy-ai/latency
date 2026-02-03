/**
 * Shared types and error classes used across all facet interfaces.
 *
 * @module common
 */

/**
 * Base error class for all facet operations.
 *
 * Provides a consistent error structure with an error `code` for programmatic
 * handling and optional `cause` for error chaining.
 *
 * @example
 * ```typescript
 * throw new FacetError('Issue not found', 'NOT_FOUND');
 * ```
 *
 * @example
 * ```typescript
 * try {
 *   await tracker.getIssue('missing');
 * } catch (err) {
 *   if (err instanceof FacetError && err.code === 'NOT_FOUND') {
 *     // handle missing issue
 *   }
 * }
 * ```
 */
export class FacetError extends Error {
  /** Machine-readable error code for programmatic handling. */
  readonly code: string;

  constructor(message: string, code: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'FacetError';
    this.code = code;
  }
}

/**
 * Pagination parameters for list operations.
 *
 * Facets with list/query methods extend this interface to support
 * consistent pagination across the system.
 */
export interface PaginatedQuery {
  /** Maximum number of items to return. */
  limit?: number;
  /** Number of items to skip before returning results. */
  offset?: number;
}

/**
 * Paginated result wrapper for list operations.
 *
 * @typeParam T - The type of items in the result set.
 */
export interface PaginatedResult<T> {
  /** The items in the current page. */
  items: T[];
  /** Total number of items matching the query. */
  total: number;
  /** Whether more items exist beyond this page. */
  hasMore: boolean;
}
