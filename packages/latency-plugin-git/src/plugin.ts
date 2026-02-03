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
import { FacetError } from '@generacy-ai/latency';
import { AbstractSourceControlPlugin } from '@generacy-ai/latency-plugin-source-control';
import type { GitConfig } from '@generacy-ai/git-interface';
import { GitClient } from './client.js';
import {
  mapLogToGitCommit,
  mapShowToGitCommit,
  mapBranchSummaryToGitBranch,
  mapStatusToDiffEntries,
  mapDiffResultToDiffEntries,
} from './mappers.js';

export class GitPlugin extends AbstractSourceControlPlugin {
  private client: GitClient;

  constructor(config: GitConfig) {
    super({ workingDirectory: config.workingDirectory });
    this.client = new GitClient(config.workingDirectory, config.defaultRemote);
  }

  protected async doCreateBranch(spec: BranchSpec): Promise<Branch> {
    const startPoint = spec.from ?? 'HEAD';
    await this.client.checkoutBranch(spec.name, startPoint);
    return this.doGetBranch(spec.name);
  }

  protected async doGetBranch(name: string): Promise<Branch> {
    const summary = await this.client.branch(['-v']);
    const branchInfo = summary.branches[name];
    if (!branchInfo) {
      throw new FacetError(`Branch '${name}' not found`, 'NOT_FOUND');
    }

    const status = await this.client.status();
    const tracking = {
      tracking: status.tracking,
      ahead: status.ahead,
      behind: status.behind,
    };

    return mapBranchSummaryToGitBranch(branchInfo, tracking);
  }

  protected async doListBranches(query?: PaginatedQuery): Promise<PaginatedResult<Branch>> {
    const summary = await this.client.branch(['-v']);
    const branches = Object.values(summary.branches).map((b) =>
      mapBranchSummaryToGitBranch(b),
    );

    const offset = query?.offset ?? 0;
    const limit = query?.limit ?? branches.length;
    const sliced = branches.slice(offset, offset + limit);

    return {
      items: sliced,
      total: branches.length,
      hasMore: offset + limit < branches.length,
    };
  }

  protected async doCommit(spec: CommitSpec): Promise<Commit> {
    await this.client.add(spec.files);
    const result = await this.client.commit(spec.message);
    const showOutput = await this.client.show(result.commit);
    return mapShowToGitCommit(showOutput);
  }

  protected async doGetCommit(ref: string): Promise<Commit> {
    const showOutput = await this.client.show(ref);
    return mapShowToGitCommit(showOutput);
  }

  protected async doListCommits(query: CommitQuery): Promise<PaginatedResult<Commit>> {
    const options: Record<string, string | number | boolean> = {};

    if (query.branch) {
      options.from = query.branch;
    }
    if (query.limit) {
      options.maxCount = query.limit;
    }

    const logResult = await this.client.log(options);
    const commits = logResult.all.map(mapLogToGitCommit);

    const offset = query.offset ?? 0;
    const limit = query.limit ?? commits.length;
    const sliced = commits.slice(offset, offset + limit);

    return {
      items: sliced,
      total: logResult.total,
      hasMore: offset + limit < logResult.total,
    };
  }

  protected async doGetDiff(from: string, to: string): Promise<DiffEntry[]> {
    const diffResult = await this.client.diffSummary(from, to);
    return mapDiffResultToDiffEntries(diffResult.files);
  }

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
    return mapStatusToDiffEntries(status);
  }
}
