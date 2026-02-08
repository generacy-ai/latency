import type { Commit, Branch } from '@generacy-ai/latency';

/**
 * Git-specific commit extending core Commit.
 * Note: `sha` is inherited from Commit — not redeclared here.
 */
export interface GitCommit extends Commit {
  shortSha: string;
  tree: string;
  parents: string[];
}

/**
 * Git-specific branch extending core Branch with tracking info.
 */
export interface GitBranch extends Branch {
  tracking?: string;
  ahead: number;
  behind: number;
}

/**
 * Configuration for the Git plugin.
 */
export interface GitConfig {
  workingDirectory: string;
  defaultRemote?: string;
}
