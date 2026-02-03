import type { GitCommit } from './types.js';

/**
 * Format a commit into a single-line summary string.
 *
 * @returns A string in the format: `"<shortSha> <first line of message>"`.
 */
export function formatCommitMessage(commit: GitCommit): string {
  const firstLine = commit.message.split('\n')[0];
  return `${commit.shortSha} ${firstLine}`;
}

/**
 * Extract the short SHA (first 7 characters) from a full SHA.
 */
export function formatShortSha(sha: string): string {
  return sha.slice(0, 7);
}
