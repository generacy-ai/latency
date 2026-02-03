import type { Commit, Branch } from '@generacy-ai/latency';
import type { GitCommit, GitBranch } from './types.js';

export function isGitCommit(commit: Commit): commit is GitCommit {
  return 'shortSha' in commit && 'tree' in commit;
}

export function isGitBranch(branch: Branch): branch is GitBranch {
  return 'ahead' in branch && 'behind' in branch;
}
