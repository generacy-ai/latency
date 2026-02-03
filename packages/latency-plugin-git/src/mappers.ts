import type { DefaultLogFields } from 'simple-git';
import type { DiffEntry } from '@generacy-ai/latency';
import type { GitCommit, GitBranch } from '@generacy-ai/git-interface';
import { formatShortSha } from '@generacy-ai/git-interface';

/**
 * Map a simple-git log entry to a GitCommit domain object.
 */
export function mapLogToGitCommit(log: DefaultLogFields & { diff?: unknown }): GitCommit {
  return {
    sha: log.hash,
    shortSha: formatShortSha(log.hash),
    message: log.message,
    author: log.author_name,
    date: new Date(log.date),
    tree: '', // Tree SHA not available from standard log output
    parents: log.refs ? parseParentRefs(log.refs) : [],
  };
}

/**
 * Map a simple-git branch summary branch to a GitBranch domain object.
 */
export function mapBranchSummaryToGitBranch(
  name: string,
  summary: { commit: string; current: boolean; label: string },
  tracking?: { ahead: number; behind: number; tracking: string },
): GitBranch {
  return {
    name,
    head: summary.commit,
    isDefault: summary.current,
    createdAt: new Date(), // Git does not track branch creation dates
    tracking: tracking?.tracking,
    ahead: tracking?.ahead ?? 0,
    behind: tracking?.behind ?? 0,
  };
}

/**
 * Map a simple-git StatusResult's files to DiffEntry array.
 */
export function mapStatusToDiffEntries(
  files: Array<{ path: string; index: string; working_dir: string; from?: string }>,
): DiffEntry[] {
  return files.map((file) => ({
    path: file.path,
    status: mapFileStatus(file.index, file.working_dir),
    additions: 0, // Status does not include line counts
    deletions: 0,
  }));
}

/**
 * Map simple-git diff result text files to DiffEntry array.
 */
export function mapDiffResultToDiffEntries(
  files: Array<{ file: string; insertions: number; deletions: number; binary: boolean }>,
): DiffEntry[] {
  return files
    .filter((f) => !f.binary)
    .map((file) => ({
      path: file.file,
      status: 'modified' as const,
      additions: file.insertions,
      deletions: file.deletions,
    }));
}

function mapFileStatus(
  index: string,
  workingDir: string,
): 'added' | 'modified' | 'deleted' | 'renamed' {
  // Prefer index status, fall back to working directory status
  const status = index !== ' ' && index !== '?' ? index : workingDir;

  switch (status) {
    case 'A':
    case '?':
      return 'added';
    case 'D':
      return 'deleted';
    case 'R':
      return 'renamed';
    case 'M':
    default:
      return 'modified';
  }
}

function parseParentRefs(refs: string): string[] {
  if (!refs.trim()) return [];
  // refs string contains branch/tag refs, not parent SHAs
  // Parent SHAs are not directly available from log output
  return [];
}
