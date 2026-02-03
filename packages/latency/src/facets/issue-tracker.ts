/**
 * Abstract interface for issue and ticket tracking systems.
 *
 * Defines a provider-agnostic API for creating, reading, updating, and
 * commenting on issues. Implementations can target any issue tracker backend
 * such as GitHub Issues, Jira, Linear, GitLab Issues, or Azure DevOps
 * Work Items.
 *
 * @module issue-tracker
 *
 * @example
 * ```typescript
 * import type { IssueTracker, IssueSpec } from './issue-tracker.js';
 *
 * async function fileAndComment(tracker: IssueTracker): Promise<void> {
 *   const spec: IssueSpec = {
 *     title: 'Latency spike on /api/checkout',
 *     body: 'p99 exceeded 500ms threshold for 10 consecutive minutes.',
 *     labels: ['bug', 'performance'],
 *     assignees: ['oncall-eng'],
 *   };
 *
 *   const issue = await tracker.createIssue(spec);
 *   await tracker.addComment(issue.id, 'Auto-generated from alerting pipeline.');
 * }
 * ```
 */

import type { PaginatedQuery, PaginatedResult } from './common.js';

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/**
 * A fully-resolved issue returned by the tracker.
 *
 * Represents the current state of an issue including all metadata and
 * timestamps managed by the underlying tracking system.
 */
export interface Issue {
  /** Unique identifier assigned by the tracking system. */
  id: string;

  /** Short summary of the issue. */
  title: string;

  /** Full description or body text of the issue. */
  body: string;

  /** Whether the issue is currently open or closed. */
  state: 'open' | 'closed';

  /** Classification labels attached to the issue. */
  labels: string[];

  /** Usernames or identifiers of people assigned to the issue. */
  assignees: string[];

  /** Timestamp when the issue was originally created. */
  createdAt: Date;

  /** Timestamp of the most recent update to the issue. */
  updatedAt: Date;
}

/**
 * Specification for creating a new issue.
 *
 * Only {@link IssueSpec.title | title} is required; all other fields are
 * optional and will use provider-specific defaults when omitted.
 */
export interface IssueSpec {
  /** Short summary of the issue. */
  title: string;

  /** Full description or body text of the issue. */
  body?: string;

  /** Classification labels to attach to the issue. */
  labels?: string[];

  /** Usernames or identifiers of people to assign to the issue. */
  assignees?: string[];
}

/**
 * Partial update payload for modifying an existing issue.
 *
 * Only the fields that are present will be changed; omitted fields remain
 * unchanged on the underlying issue.
 */
export interface IssueUpdate {
  /** Updated summary of the issue. */
  title?: string;

  /** Updated description or body text. */
  body?: string;

  /** Transition the issue to open or closed. */
  state?: 'open' | 'closed';

  /** Replace the full set of labels on the issue. */
  labels?: string[];

  /** Replace the full set of assignees on the issue. */
  assignees?: string[];
}

/**
 * Query parameters for listing issues.
 *
 * Extends {@link PaginatedQuery} to support limit/offset pagination
 * alongside issue-specific filters.
 */
export interface IssueQuery extends PaginatedQuery {
  /** Filter by issue state. Defaults to provider-specific behavior. */
  state?: 'open' | 'closed' | 'all';

  /** Filter to issues that carry **all** of the specified labels. */
  labels?: string[];

  /** Filter to issues assigned to the given username or identifier. */
  assignee?: string;
}

/**
 * A comment attached to an issue.
 */
export interface Comment {
  /** Unique identifier of the comment. */
  id: string;

  /** The text content of the comment. */
  body: string;

  /** Username or identifier of the comment author. */
  author: string;

  /** Timestamp when the comment was created. */
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Facet interface
// ---------------------------------------------------------------------------

/**
 * Provider-agnostic interface for issue and ticket tracking.
 *
 * All methods are asynchronous and return Promises so that implementations
 * can interact with remote APIs, databases, or other async backends without
 * blocking.
 *
 * Implementations should throw {@link import('./common.js').FacetError | FacetError}
 * with appropriate error codes (e.g. `'NOT_FOUND'`, `'VALIDATION'`,
 * `'AUTH'`) when operations fail.
 */
export interface IssueTracker {
  /**
   * Create a new issue from the given specification.
   *
   * @param spec - The specification describing the issue to create.
   * @returns The newly created issue with all server-assigned fields populated.
   */
  createIssue(spec: IssueSpec): Promise<Issue>;

  /**
   * Retrieve a single issue by its unique identifier.
   *
   * @param id - The unique identifier of the issue.
   * @returns The resolved issue.
   * @throws {FacetError} With code `'NOT_FOUND'` if no issue exists for the
   *   given identifier.
   */
  getIssue(id: string): Promise<Issue>;

  /**
   * Apply a partial update to an existing issue.
   *
   * Only the fields present in {@link IssueUpdate} are modified; all other
   * fields on the issue remain unchanged.
   *
   * @param id - The unique identifier of the issue to update.
   * @param update - The fields to change on the issue.
   * @returns The issue after the update has been applied.
   * @throws {FacetError} With code `'NOT_FOUND'` if no issue exists for the
   *   given identifier.
   */
  updateIssue(id: string, update: IssueUpdate): Promise<Issue>;

  /**
   * List issues matching the given query parameters.
   *
   * Results are returned in a {@link PaginatedResult} wrapper that includes
   * the total count and a flag indicating whether more pages are available.
   *
   * @param query - Filtering and pagination parameters.
   * @returns A paginated set of issues matching the query.
   */
  listIssues(query: IssueQuery): Promise<PaginatedResult<Issue>>;

  /**
   * Add a text comment to an existing issue.
   *
   * @param issueId - The unique identifier of the issue to comment on.
   * @param comment - The text content of the comment.
   * @returns The newly created comment with server-assigned fields populated.
   * @throws {FacetError} With code `'NOT_FOUND'` if no issue exists for the
   *   given identifier.
   */
  addComment(issueId: string, comment: string): Promise<Comment>;
}
