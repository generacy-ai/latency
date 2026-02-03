import type { Commit, Branch } from '@generacy-ai/latency';

/**
 * Git-specific commit with additional fields beyond the base Commit interface.
 * The `sha` field is inherited from Commit.
 */
export interface GitCommit extends Commit {
  /** First 7 characters of the commit SHA. */
  shortSha: string;

  /** Tree object SHA. */
  tree: string;

  /** Parent commit SHAs. */
  parents: string[];
}

/**
 * Git-specific branch with tracking information.
 */
export interface GitBranch extends Branch {
  /** Remote tracking branch name (e.g. "origin/main"). */
  tracking?: string;

  /** Number of commits ahead of the tracking branch. */
  ahead: number;

  /** Number of commits behind the tracking branch. */
  behind: number;
}

/**
 * Git blame information for a single line.
 */
export interface GitBlame {
  /** Blame commit SHA. */
  sha: string;

  /** Author of the blamed line. */
  author: string;

  /** Date of the blamed commit. */
  date: Date;

  /** Line number (1-based). */
  line: number;

  /** Line content. */
  content: string;
}

/**
 * Configuration for the Git plugin.
 */
export interface GitConfig {
  /** Path to the git repository. */
  workingDirectory: string;

  /** Default remote for push/pull operations. Defaults to "origin". */
  defaultRemote?: string;
}
