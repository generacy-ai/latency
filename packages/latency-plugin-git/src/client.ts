import { simpleGit } from 'simple-git';
import type {
  SimpleGit,
  LogResult,
  StatusResult,
  BranchSummary,
  DiffResult,
  CommitResult,
  PushResult,
  PullResult,
} from 'simple-git';
import { mapGitError } from './errors.js';

/**
 * Thin wrapper around simple-git scoped to a single repository.
 * All methods wrap git calls with mapGitError for consistent error handling.
 */
export class GitClient {
  private git: SimpleGit;
  private defaultRemote: string;

  constructor(workingDirectory: string, defaultRemote?: string) {
    this.git = simpleGit(workingDirectory);
    this.defaultRemote = defaultRemote ?? 'origin';
  }

  async log(options?: string[]): Promise<LogResult> {
    try {
      return await this.git.log(options);
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async status(): Promise<StatusResult> {
    try {
      return await this.git.status();
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async add(files: string[]): Promise<string> {
    try {
      return await this.git.add(files);
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async commit(message: string): Promise<CommitResult> {
    try {
      return await this.git.commit(message);
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async branch(options?: string[]): Promise<BranchSummary> {
    try {
      return await this.git.branch(options);
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async checkout(ref: string): Promise<string> {
    try {
      return await this.git.checkout(ref);
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async checkoutBranch(name: string, startPoint: string): Promise<void> {
    try {
      await this.git.checkoutBranch(name, startPoint);
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async diff(options: string[]): Promise<string> {
    try {
      return await this.git.diff(options);
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async diffSummary(options: string[]): Promise<DiffResult> {
    try {
      return await this.git.diffSummary(options);
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async push(remote?: string, branch?: string): Promise<PushResult> {
    try {
      return await this.git.push(remote ?? this.defaultRemote, branch);
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async pull(remote?: string, branch?: string): Promise<PullResult> {
    try {
      return await this.git.pull(remote ?? this.defaultRemote, branch);
    } catch (error) {
      throw mapGitError(error);
    }
  }

  async show(ref: string): Promise<string> {
    try {
      return await this.git.show([ref, '--format=%H%n%s%n%an%n%aI%n%T%n%P', '--no-patch']);
    } catch (error) {
      throw mapGitError(error);
    }
  }
}
