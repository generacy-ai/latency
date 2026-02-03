export { GitPlugin } from './plugin.js';
export { GitClient } from './client.js';
export { mapGitError } from './errors.js';
export {
  mapLogToGitCommit,
  mapBranchSummaryToGitBranch,
  mapStatusToDiffEntries,
  mapDiffResultToDiffEntries,
} from './mappers.js';

// Re-export interface types for consumer convenience
export type {
  GitCommit,
  GitBranch,
  GitBlame,
  GitConfig,
} from '@generacy-ai/git-interface';
export { isGitCommit, isGitBranch, formatCommitMessage, formatShortSha } from '@generacy-ai/git-interface';
