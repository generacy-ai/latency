import type { GitCommit } from './types.js';

export function formatCommitMessage(commit: GitCommit): string {
  return `${commit.shortSha} ${commit.message}`;
}

export function formatShortSha(sha: string): string {
  return sha.slice(0, 7);
}
