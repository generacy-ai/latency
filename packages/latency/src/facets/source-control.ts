/**
 * Abstract interface for source control systems.
 *
 * Defines operations for branches, commits, and diffs that can be implemented
 * by any source control provider such as Git/GitHub, GitLab, Bitbucket, or
 * other version control systems.
 *
 * All operations are async-first, returning Promises to accommodate both local
 * and remote source control backends.
 *
 * @example
 * ```typescript
 * import type { SourceControl } from './source-control.js';
 *
 * class GitHubSourceControl implements SourceControl {
 *   // ... implement all methods against the GitHub API
 * }
 *
 * class GitLabSourceControl implements SourceControl {
 *   // ... implement all methods against the GitLab API
 * }
 * ```
 *
 * @module source-control
 */

import type { PaginatedQuery, PaginatedResult } from './common.js';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/**
 * Represents a branch in the source control system.
 */
export interface Branch {
  /** The branch name (e.g. `"main"`, `"feature/login"`). */
  name: string;

  /** The SHA of the commit at the branch head. */
  head: string;

  /** Whether this is the repository's default branch. */
  isDefault: boolean;

  /** When the branch was created. */
  createdAt: Date;
}

/**
 * Parameters for creating a new branch.
 */
export interface BranchSpec {
  /** The name for the new branch. */
  name: string;

  /**
   * The ref (branch name or commit SHA) to branch from.
   *
   * When omitted, the implementation should branch from the repository's
   * default branch.
   */
  from?: string;
}

/**
 * Represents a single commit in the source control history.
 */
export interface Commit {
  /** The full SHA hash of the commit. */
  sha: string;

  /** The commit message. */
  message: string;

  /** The author of the commit (name or identifier). */
  author: string;

  /** When the commit was authored. */
  date: Date;
}

/**
 * Parameters for creating a new commit.
 */
export interface CommitSpec {
  /** The commit message describing the changes. */
  message: string;

  /** Paths of the files to include in the commit. */
  files: string[];
}

/**
 * Query parameters for listing commits with optional filters.
 *
 * Extends {@link PaginatedQuery} to support pagination.
 */
export interface CommitQuery extends PaginatedQuery {
  /** Filter commits to a specific branch. */
  branch?: string;

  /** Filter commits by author name or identifier. */
  author?: string;

  /** Only include commits authored on or after this date. */
  since?: Date;

  /** Only include commits authored on or before this date. */
  until?: Date;
}

/**
 * Represents a single entry in a diff between two refs.
 */
export interface DiffEntry {
  /** The file path relative to the repository root. */
  path: string;

  /** The type of change applied to the file. */
  status: 'added' | 'modified' | 'deleted' | 'renamed';

  /** Number of lines added. */
  additions: number;

  /** Number of lines deleted. */
  deletions: number;
}

// ---------------------------------------------------------------------------
// Facet interface
// ---------------------------------------------------------------------------

/**
 * Source control facet interface.
 *
 * Provides abstract operations for branch management, commits, and diffs.
 * Implementations bridge to a concrete source control backend such as
 * Git/GitHub, GitLab, Bitbucket, Azure DevOps, or any other VCS provider.
 */
export interface SourceControl {
  /**
   * Create a new branch.
   *
   * @param spec - The branch creation parameters.
   * @returns The newly created branch.
   *
   * @example
   * ```typescript
   * const branch = await sc.createBranch({ name: 'feature/login', from: 'main' });
   * console.log(branch.head); // SHA of the branch head
   * ```
   */
  createBranch(spec: BranchSpec): Promise<Branch>;

  /**
   * Get information about a branch by name.
   *
   * @param name - The branch name to look up.
   * @returns The branch details.
   *
   * @throws {FacetError} with code `'NOT_FOUND'` if the branch does not exist.
   */
  getBranch(name: string): Promise<Branch>;

  /**
   * List branches with optional pagination.
   *
   * @param query - Optional pagination parameters.
   * @returns A paginated result set of branches.
   *
   * @example
   * ```typescript
   * const result = await sc.listBranches({ limit: 10 });
   * console.log(`${result.total} branches, showing ${result.items.length}`);
   * ```
   */
  listBranches(query?: PaginatedQuery): Promise<PaginatedResult<Branch>>;

  /**
   * Create a new commit with the specified files.
   *
   * @param spec - The commit parameters including message and file paths.
   * @returns The newly created commit.
   *
   * @example
   * ```typescript
   * const commit = await sc.commit({
   *   message: 'fix: resolve login redirect',
   *   files: ['src/auth/login.ts'],
   * });
   * console.log(commit.sha);
   * ```
   */
  commit(spec: CommitSpec): Promise<Commit>;

  /**
   * Get a commit by its ref (SHA, tag, or symbolic ref).
   *
   * @param ref - The commit reference to look up.
   * @returns The commit details.
   *
   * @throws {FacetError} with code `'NOT_FOUND'` if the ref cannot be resolved.
   */
  getCommit(ref: string): Promise<Commit>;

  /**
   * List commits matching the given query filters.
   *
   * @param query - Filtering and pagination parameters.
   * @returns A paginated result set of commits.
   *
   * @example
   * ```typescript
   * const result = await sc.listCommits({
   *   branch: 'main',
   *   since: new Date('2025-01-01'),
   *   limit: 25,
   * });
   * ```
   */
  listCommits(query: CommitQuery): Promise<PaginatedResult<Commit>>;

  /**
   * Get the diff between two refs.
   *
   * Returns the list of changed files with their modification status and
   * line-level addition/deletion counts.
   *
   * @param from - The base ref (SHA, branch, or tag).
   * @param to - The target ref to compare against the base.
   * @returns An array of diff entries describing each changed file.
   *
   * @example
   * ```typescript
   * const diff = await sc.getDiff('main', 'feature/login');
   * for (const entry of diff) {
   *   console.log(`${entry.status} ${entry.path} (+${entry.additions} -${entry.deletions})`);
   * }
   * ```
   */
  getDiff(from: string, to: string): Promise<DiffEntry[]>;
}
