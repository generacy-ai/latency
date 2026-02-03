import type {
  Issue,
  IssueSpec,
  IssueUpdate,
  IssueQuery,
  IssueTracker,
  Comment,
  PaginatedResult,
} from '@generacy-ai/latency';

import { type CacheEntry, createCacheEntry, isCacheExpired } from './caching.js';
import { ValidationError } from './validation.js';

/**
 * Configuration options for {@link AbstractIssueTrackerPlugin}.
 */
export interface AbstractIssueTrackerOptions {
  /** Cache TTL in milliseconds. Defaults to 60000 (1 minute). */
  cacheTimeout?: number;
}

/**
 * Abstract base class for issue tracker plugin implementations.
 *
 * Provides common caching, validation, and error handling logic using the
 * Template Method pattern. Concrete implementations (e.g., GitHub, Jira, Linear)
 * extend this class and implement only the protected `do*` methods.
 *
 * @example
 * ```typescript
 * class GitHubIssueTracker extends AbstractIssueTrackerPlugin {
 *   protected async fetchIssue(id: string): Promise<Issue> {
 *     // GitHub API call
 *   }
 *   // ... other do* methods
 * }
 * ```
 */
export abstract class AbstractIssueTrackerPlugin implements IssueTracker {
  protected readonly cache = new Map<string, CacheEntry<Issue>>();
  protected readonly cacheTimeout: number;

  constructor(options?: AbstractIssueTrackerOptions) {
    this.cacheTimeout = options?.cacheTimeout ?? 60000;
  }

  /**
   * Retrieve an issue by ID, returning a cached value if available and not expired.
   */
  async getIssue(id: string): Promise<Issue> {
    const cached = this.cache.get(id);
    if (cached && !isCacheExpired(cached, this.cacheTimeout)) {
      return cached.value;
    }
    const issue = await this.fetchIssue(id);
    this.cache.set(id, createCacheEntry(issue));
    return issue;
  }

  /**
   * Create a new issue after validating the spec.
   */
  async createIssue(spec: IssueSpec): Promise<Issue> {
    this.validateIssueSpec(spec);
    const issue = await this.doCreateIssue(spec);
    this.cache.set(issue.id, createCacheEntry(issue));
    return issue;
  }

  /**
   * Update an existing issue after validating the update payload.
   */
  async updateIssue(id: string, update: IssueUpdate): Promise<Issue> {
    this.validateIssueUpdate(update);
    const issue = await this.doUpdateIssue(id, update);
    this.cache.set(id, createCacheEntry(issue));
    return issue;
  }

  /**
   * List issues matching the given query. Results are not cached.
   */
  async listIssues(query: IssueQuery): Promise<PaginatedResult<Issue>> {
    return this.doListIssues(query);
  }

  /**
   * Add a comment to an issue. Validates that the comment is non-empty.
   */
  async addComment(issueId: string, comment: string): Promise<Comment> {
    if (!comment?.trim()) {
      throw new ValidationError('Comment cannot be empty');
    }
    return this.doAddComment(issueId, comment);
  }

  /**
   * Invalidate cached entries. Pass an ID to clear a single entry,
   * or call with no arguments to clear the entire cache.
   */
  invalidateCache(id?: string): void {
    if (id) {
      this.cache.delete(id);
    } else {
      this.cache.clear();
    }
  }

  // -------------------------------------------------------------------------
  // Abstract methods for subclasses
  // -------------------------------------------------------------------------

  /** Fetch a single issue from the backend. */
  protected abstract fetchIssue(id: string): Promise<Issue>;

  /** Create an issue in the backend. */
  protected abstract doCreateIssue(spec: IssueSpec): Promise<Issue>;

  /** Update an issue in the backend. */
  protected abstract doUpdateIssue(id: string, update: IssueUpdate): Promise<Issue>;

  /** List issues from the backend. */
  protected abstract doListIssues(query: IssueQuery): Promise<PaginatedResult<Issue>>;

  /** Add a comment in the backend. */
  protected abstract doAddComment(issueId: string, comment: string): Promise<Comment>;

  // -------------------------------------------------------------------------
  // Validation helpers (overridable by subclasses)
  // -------------------------------------------------------------------------

  /**
   * Validate an issue creation spec. Override to add additional validation.
   * @throws {ValidationError} If the spec is invalid.
   */
  protected validateIssueSpec(spec: IssueSpec): void {
    if (!spec.title?.trim()) {
      throw new ValidationError('Issue title is required');
    }
  }

  /**
   * Validate an issue update payload. Override to add additional validation.
   * @throws {ValidationError} If the update is invalid.
   */
  protected validateIssueUpdate(update: IssueUpdate): void {
    if (update.title !== undefined && !update.title.trim()) {
      throw new ValidationError('Issue title cannot be empty');
    }
  }
}
