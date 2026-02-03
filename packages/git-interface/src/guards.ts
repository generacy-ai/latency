import type { Commit, Branch } from '@generacy-ai/latency';
import type { GitCommit, GitBranch } from './types.js';

/**
 * Type guard to check if a Commit is a GitCommit.
 */
export function isGitCommit(commit: Commit): commit is GitCommit {
  return 'shortSha' in commit && 'tree' in commit;
}

/**
 * Type guard to check if a Branch is a GitBranch.
 */
export function isGitBranch(branch: Branch): branch is GitBranch {
  return 'ahead' in branch && 'behind' in branch;
}
