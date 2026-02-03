import type { DiffEntry } from '@generacy-ai/latency';
import type { GitCommit, GitBranch } from '@generacy-ai/git-interface';
import { formatShortSha } from '@generacy-ai/git-interface';
import type {
  DefaultLogFields,
  BranchSummaryBranch,
  StatusResult,
  DiffResultTextFile,
  DiffResultBinaryFile,
} from 'simple-git';

/**
 * Convert a simple-git log entry to a GitCommit.
 */
export function mapLogToGitCommit(log: DefaultLogFields): GitCommit {
  return {
    sha: log.hash,
    shortSha: formatShortSha(log.hash),
    message: log.message,
    author: log.author_name,
    date: new Date(log.date),
    tree: '',
    parents: [],
  };
}

/**
 * Convert a simple-git log entry with tree/parent info (from `git show`) to a GitCommit.
 */
export function mapShowToGitCommit(showOutput: string): GitCommit {
  const lines = showOutput.trim().split('\n');
  const sha = lines[0] ?? '';
  const date = lines[1] ?? '';
  const author = lines[2] ?? '';
  const message = lines[3] ?? '';
  const tree = lines[4] ?? '';
  const parentLine = lines[5] ?? '';
  const parents = parentLine ? parentLine.split(' ').filter(Boolean) : [];

  return {
    sha,
    shortSha: formatShortSha(sha),
    message,
    author,
    date: new Date(date),
    tree,
    parents,
  };
}

/**
 * Convert a simple-git BranchSummaryBranch to a GitBranch.
 */
export function mapBranchSummaryToGitBranch(
  summary: BranchSummaryBranch,
  tracking?: { tracking: string | null; ahead: number; behind: number },
): GitBranch {
  return {
    name: summary.name,
    head: summary.commit,
    isDefault: summary.current,
    createdAt: new Date(),
    tracking: tracking?.tracking ?? undefined,
    ahead: tracking?.ahead ?? 0,
    behind: tracking?.behind ?? 0,
  };
}

/**
 * Convert a simple-git StatusResult to DiffEntry[].
 */
export function mapStatusToDiffEntries(status: StatusResult): DiffEntry[] {
  const entries: DiffEntry[] = [];

  for (const file of status.created) {
    entries.push({ path: file, status: 'added', additions: 0, deletions: 0 });
  }
  for (const file of status.modified) {
    entries.push({ path: file, status: 'modified', additions: 0, deletions: 0 });
  }
  for (const file of status.deleted) {
    entries.push({ path: file, status: 'deleted', additions: 0, deletions: 0 });
  }
  for (const renamed of status.renamed) {
    entries.push({ path: renamed.to, status: 'renamed', additions: 0, deletions: 0 });
  }
  for (const file of status.not_added) {
    entries.push({ path: file, status: 'added', additions: 0, deletions: 0 });
  }

  return entries;
}

/**
 * Convert simple-git DiffResult files to DiffEntry[].
 */
export function mapDiffResultToDiffEntries(
  files: Array<DiffResultTextFile | DiffResultBinaryFile>,
): DiffEntry[] {
  return files.map((file) => {
    if (file.binary) {
      return {
        path: file.file,
        status: 'modified' as const,
        additions: 0,
        deletions: 0,
      };
    }

    const textFile = file as DiffResultTextFile;
    return {
      path: textFile.file,
      status: 'modified' as const,
      additions: textFile.insertions,
      deletions: textFile.deletions,
    };
  });
}
