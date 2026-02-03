/**
 * Abstract base class for source control plugins.
 *
 * Implements the {@link SourceControl} interface with input validation,
 * delegating actual VCS operations to protected abstract `do*` methods
 * that subclasses must implement.
 *
 * @example
 * ```typescript
 * import { AbstractSourceControlPlugin } from '@generacy-ai/latency-plugin-source-control';
 *
 * class GitPlugin extends AbstractSourceControlPlugin {
 *   protected async doCommit(spec: CommitSpec): Promise<Commit> {
 *     // Git-specific commit logic
 *   }
 *   // ... implement remaining abstract methods
 * }
 *
 * const plugin = new GitPlugin({ workingDirectory: '/path/to/repo' });
 * ```
 *
 * @module abstract-source-control-plugin
 */
import type {
  SourceControl,
  Commit,
  CommitSpec,
  Branch,
  BranchSpec,
  DiffEntry,
  CommitQuery,
  PaginatedQuery,
  PaginatedResult,
} from '@generacy-ai/latency';

import { ValidationError } from './validation-error.js';

/**
 * Abstract source control plugin providing common validation and shared
 * logic for all version control implementations.
 *
 * Each public method validates its inputs and delegates to a corresponding
 * protected abstract `do*` method. Subclasses implement the `do*` methods
 * with provider-specific logic (e.g., Git, GitHub API, GitLab API).
 */
export abstract class AbstractSourceControlPlugin implements SourceControl {
  /** The working directory for VCS operations. */
  protected workingDirectory: string;

  /**
   * Create a new source control plugin instance.
   *
   * @param options - Plugin configuration.
   * @param options.workingDirectory - The root directory for VCS operations.
   */
  constructor(options: { workingDirectory: string }) {
    this.workingDirectory = options.workingDirectory;
  }

  // --- SourceControl interface methods (with common validation) ---

  /**
   * Create a new branch.
   *
   * Validates that the branch name is non-empty before delegating
   * to {@link doCreateBranch}.
   *
   * @param spec - The branch creation parameters.
   * @returns The newly created branch.
   * @throws {ValidationError} If the branch name is empty or whitespace.
   */
  async createBranch(spec: BranchSpec): Promise<Branch> {
    if (!spec.name?.trim()) {
      throw new ValidationError('Branch name is required');
    }
    return this.doCreateBranch(spec);
  }

  /**
   * Get information about a branch by name.
   *
   * Validates that the branch name is non-empty before delegating
   * to {@link doGetBranch}.
   *
   * @param name - The branch name to look up.
   * @returns The branch details.
   * @throws {ValidationError} If the branch name is empty or whitespace.
   */
  async getBranch(name: string): Promise<Branch> {
    if (!name?.trim()) {
      throw new ValidationError('Branch name is required');
    }
    return this.doGetBranch(name);
  }

  /**
   * List branches with optional pagination.
   *
   * Delegates directly to {@link doListBranches} with no additional validation.
   *
   * @param query - Optional pagination parameters.
   * @returns A paginated result set of branches.
   */
  async listBranches(query?: PaginatedQuery): Promise<PaginatedResult<Branch>> {
    return this.doListBranches(query);
  }

  /**
   * Create a new commit with the specified files.
   *
   * Validates that the commit message is non-empty and at least one file
   * is specified before delegating to {@link doCommit}.
   *
   * @param spec - The commit parameters including message and file paths.
   * @returns The newly created commit.
   * @throws {ValidationError} If the message is empty or no files are specified.
   */
  async commit(spec: CommitSpec): Promise<Commit> {
    if (!spec.message?.trim()) {
      throw new ValidationError('Commit message is required');
    }
    if (!spec.files?.length) {
      throw new ValidationError('At least one file must be staged');
    }
    return this.doCommit(spec);
  }

  /**
   * Get a commit by its ref (SHA, tag, or symbolic ref).
   *
   * Validates that the ref is non-empty before delegating
   * to {@link doGetCommit}.
   *
   * @param ref - The commit reference to look up.
   * @returns The commit details.
   * @throws {ValidationError} If the ref is empty or whitespace.
   */
  async getCommit(ref: string): Promise<Commit> {
    if (!ref?.trim()) {
      throw new ValidationError('Commit ref is required');
    }
    return this.doGetCommit(ref);
  }

  /**
   * List commits matching the given query filters.
   *
   * Delegates directly to {@link doListCommits} with no additional validation.
   *
   * @param query - Filtering and pagination parameters.
   * @returns A paginated result set of commits.
   */
  async listCommits(query: CommitQuery): Promise<PaginatedResult<Commit>> {
    return this.doListCommits(query);
  }

  /**
   * Get the diff between two refs.
   *
   * Validates that both `from` and `to` refs are non-empty before
   * delegating to {@link doGetDiff}.
   *
   * @param from - The base ref (SHA, branch, or tag).
   * @param to - The target ref to compare against the base.
   * @returns An array of diff entries describing each changed file.
   * @throws {ValidationError} If either ref is empty or whitespace.
   */
  async getDiff(from: string, to: string): Promise<DiffEntry[]> {
    if (!from?.trim()) {
      throw new ValidationError('Diff "from" ref is required');
    }
    if (!to?.trim()) {
      throw new ValidationError('Diff "to" ref is required');
    }
    return this.doGetDiff(from, to);
  }

  // --- Abstract methods for SourceControl interface ---

  /** Implement branch creation for the specific VCS provider. */
  protected abstract doCreateBranch(spec: BranchSpec): Promise<Branch>;

  /** Implement branch lookup for the specific VCS provider. */
  protected abstract doGetBranch(name: string): Promise<Branch>;

  /** Implement branch listing for the specific VCS provider. */
  protected abstract doListBranches(query?: PaginatedQuery): Promise<PaginatedResult<Branch>>;

  /** Implement commit creation for the specific VCS provider. */
  protected abstract doCommit(spec: CommitSpec): Promise<Commit>;

  /** Implement commit lookup for the specific VCS provider. */
  protected abstract doGetCommit(ref: string): Promise<Commit>;

  /** Implement commit listing for the specific VCS provider. */
  protected abstract doListCommits(query: CommitQuery): Promise<PaginatedResult<Commit>>;

  /** Implement diff retrieval for the specific VCS provider. */
  protected abstract doGetDiff(from: string, to: string): Promise<DiffEntry[]>;

  // --- Additional VCS operations (beyond SourceControl interface) ---

  /** Push local changes to a remote repository. */
  protected abstract doPush(remote?: string, branch?: string): Promise<void>;

  /** Pull changes from a remote repository. */
  protected abstract doPull(remote?: string, branch?: string): Promise<void>;

  /** Check out a ref (branch, tag, or commit SHA). */
  protected abstract doCheckout(ref: string): Promise<void>;

  /** Get the current working directory status (changed files). */
  protected abstract doGetStatus(): Promise<DiffEntry[]>;
}
