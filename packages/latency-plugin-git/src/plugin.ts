import type {
  Commit,
  CommitSpec,
  Branch,
  BranchSpec,
  DiffEntry,
  CommitQuery,
  PaginatedQuery,
  PaginatedResult,
} from '@generacy-ai/latency';
import { AbstractSourceControlPlugin } from '@generacy-ai/latency-plugin-source-control';
import type { GitConfig, GitCommit } from '@generacy-ai/git-interface';
import { formatShortSha } from '@generacy-ai/git-interface';
import { GitClient } from './client.js';
import {
  mapLogToGitCommit,
  mapBranchSummaryToGitBranch,
  mapStatusToDiffEntries,
  mapDiffResultToDiffEntries,
} from './mappers.js';

/**
 * Git source control plugin extending AbstractSourceControlPlugin.
 *
 * Uses simple-git under the hood via GitClient to perform local
 * Git operations.
 */
export class GitPlugin extends AbstractSourceControlPlugin {
  private client: GitClient;

  constructor(config: GitConfig) {
    super({ workingDirectory: config.workingDirectory });
    this.client = new GitClient(config.workingDirectory, config.defaultRemote);
  }

  // --- SourceControl interface methods (7) ---

  protected async doCreateBranch(spec: BranchSpec): Promise<Branch> {
    const startPoint = spec.from ?? 'HEAD';
    await this.client.checkoutBranch(spec.name, startPoint);

    const summary = await this.client.branch();
    const branchInfo = summary.branches[spec.name];
    if (!branchInfo) {
      // Branch was created but not in summary; construct minimal Branch
      return {
        name: spec.name,
        head: '',
        isDefault: false,
        createdAt: new Date(),
      };
    }

    return mapBranchSummaryToGitBranch(spec.name, branchInfo);
  }

  protected async doGetBranch(name: string): Promise<Branch> {
    const summary = await this.client.branch(['-v']);
    const branchInfo = summary.branches[name];
    if (!branchInfo) {
      const { FacetError } = await import('@generacy-ai/latency');
      throw new FacetError(`Branch not found: ${name}`, 'NOT_FOUND');
    }

    // Get tracking info if available
    const trackingSummary = await this.client.branch(['-vv']);
    const trackingBranch = trackingSummary.branches[name];
    let tracking: { ahead: number; behind: number; tracking: string } | undefined;

    if (trackingBranch) {
      const trackingMatch = trackingBranch.label.match(/\[([^\]]+)\]/);
      if (trackingMatch) {
        const trackingRef = trackingMatch[1].split(':')[0].trim();
        const aheadMatch = trackingBranch.label.match(/ahead (\d+)/);
        const behindMatch = trackingBranch.label.match(/behind (\d+)/);
        tracking = {
          tracking: trackingRef,
          ahead: aheadMatch ? parseInt(aheadMatch[1], 10) : 0,
          behind: behindMatch ? parseInt(behindMatch[1], 10) : 0,
        };
      }
    }

    return mapBranchSummaryToGitBranch(name, branchInfo, tracking);
  }

  protected async doListBranches(query?: PaginatedQuery): Promise<PaginatedResult<Branch>> {
    const summary = await this.client.branch(['-v']);
    const branchNames = Object.keys(summary.branches);

    const limit = query?.limit ?? branchNames.length;
    const offset = query?.offset ?? 0;
    const slice = branchNames.slice(offset, offset + limit);

    const items: Branch[] = slice.map((name) =>
      mapBranchSummaryToGitBranch(name, summary.branches[name]),
    );

    return {
      items,
      total: branchNames.length,
      hasMore: offset + limit < branchNames.length,
    };
  }

  protected async doCommit(spec: CommitSpec): Promise<Commit> {
    await this.client.add(spec.files);
    const result = await this.client.commit(spec.message);

    const commit: GitCommit = {
      sha: result.commit,
      shortSha: formatShortSha(result.commit),
      message: spec.message,
      author: result.author?.name ?? '',
      date: new Date(),
      tree: '',
      parents: [],
    };

    return commit;
  }

  protected async doGetCommit(ref: string): Promise<Commit> {
    const output = await this.client.show(ref);
    const lines = output.trim().split('\n');

    const sha = lines[0] ?? '';
    const message = lines[1] ?? '';
    const author = lines[2] ?? '';
    const dateStr = lines[3] ?? '';
    const tree = lines[4] ?? '';
    const parentLine = lines[5] ?? '';

    const commit: GitCommit = {
      sha,
      shortSha: formatShortSha(sha),
      message,
      author,
      date: new Date(dateStr),
      tree,
      parents: parentLine ? parentLine.split(' ').filter(Boolean) : [],
    };

    return commit;
  }

  protected async doListCommits(query: CommitQuery): Promise<PaginatedResult<Commit>> {
    const options: string[] = [];

    if (query.branch) {
      options.push(query.branch);
    }
    if (query.author) {
      options.push(`--author=${query.author}`);
    }
    if (query.since) {
      options.push(`--since=${query.since.toISOString()}`);
    }
    if (query.until) {
      options.push(`--until=${query.until.toISOString()}`);
    }

    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;
    options.push(`--max-count=${offset + limit}`);

    const logResult = await this.client.log(options.length > 0 ? options : undefined);
    const allCommits = logResult.all.map(mapLogToGitCommit);
    const items = allCommits.slice(offset, offset + limit);

    return {
      items,
      total: logResult.total,
      hasMore: offset + limit < logResult.total,
    };
  }

  protected async doGetDiff(from: string, to: string): Promise<DiffEntry[]> {
    const result = await this.client.diffSummary([from, to]);
    return mapDiffResultToDiffEntries(result.files as Array<{ file: string; insertions: number; deletions: number; binary: boolean }>);
  }

  // --- Additional VCS operations (4) ---

  protected async doPush(remote?: string, branch?: string): Promise<void> {
    await this.client.push(remote, branch);
  }

  protected async doPull(remote?: string, branch?: string): Promise<void> {
    await this.client.pull(remote, branch);
  }

  protected async doCheckout(ref: string): Promise<void> {
    await this.client.checkout(ref);
  }

  protected async doGetStatus(): Promise<DiffEntry[]> {
    const status = await this.client.status();
    return mapStatusToDiffEntries(status.files);
  }
}
