import { describe, it, expect, vi } from 'vitest';
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
import { AbstractSourceControlPlugin, ValidationError } from '../src/index.js';

// ---------------------------------------------------------------------------
// Concrete test subclass with stubs
// ---------------------------------------------------------------------------

class TestSourceControlPlugin extends AbstractSourceControlPlugin {
  doCreateBranch = vi.fn<(spec: BranchSpec) => Promise<Branch>>().mockResolvedValue({
    name: 'test-branch',
    head: 'abc123',
    isDefault: false,
    createdAt: new Date('2025-01-01'),
  });

  doGetBranch = vi.fn<(name: string) => Promise<Branch>>().mockResolvedValue({
    name: 'main',
    head: 'abc123',
    isDefault: true,
    createdAt: new Date('2025-01-01'),
  });

  doListBranches = vi.fn<(query?: PaginatedQuery) => Promise<PaginatedResult<Branch>>>().mockResolvedValue({
    items: [],
    total: 0,
    hasMore: false,
  });

  doCommit = vi.fn<(spec: CommitSpec) => Promise<Commit>>().mockResolvedValue({
    sha: 'def456',
    message: 'test commit',
    author: 'test-author',
    date: new Date('2025-01-01'),
  });

  doGetCommit = vi.fn<(ref: string) => Promise<Commit>>().mockResolvedValue({
    sha: 'def456',
    message: 'test commit',
    author: 'test-author',
    date: new Date('2025-01-01'),
  });

  doListCommits = vi.fn<(query: CommitQuery) => Promise<PaginatedResult<Commit>>>().mockResolvedValue({
    items: [],
    total: 0,
    hasMore: false,
  });

  doGetDiff = vi.fn<(from: string, to: string) => Promise<DiffEntry[]>>().mockResolvedValue([]);

  doPush = vi.fn<(remote?: string, branch?: string) => Promise<void>>().mockResolvedValue(undefined);
  doPull = vi.fn<(remote?: string, branch?: string) => Promise<void>>().mockResolvedValue(undefined);
  doCheckout = vi.fn<(ref: string) => Promise<void>>().mockResolvedValue(undefined);
  doGetStatus = vi.fn<() => Promise<DiffEntry[]>>().mockResolvedValue([]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AbstractSourceControlPlugin', () => {
  // -- Constructor --

  describe('constructor', () => {
    it('stores workingDirectory from options', () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      // Access via the protected field through the test subclass
      expect((plugin as unknown as { workingDirectory: string }).workingDirectory).toBe('/repo');
    });
  });

  // -- createBranch --

  describe('createBranch', () => {
    it('rejects empty branch name', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.createBranch({ name: '' })).rejects.toThrow(ValidationError);
      await expect(plugin.createBranch({ name: '' })).rejects.toThrow('Branch name is required');
    });

    it('rejects whitespace-only branch name', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.createBranch({ name: '   ' })).rejects.toThrow(ValidationError);
    });

    it('delegates to doCreateBranch with valid input', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      const spec: BranchSpec = { name: 'feature/login', from: 'main' };
      const result = await plugin.createBranch(spec);
      expect(plugin.doCreateBranch).toHaveBeenCalledWith(spec);
      expect(result.name).toBe('test-branch');
    });
  });

  // -- getBranch --

  describe('getBranch', () => {
    it('rejects empty branch name', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.getBranch('')).rejects.toThrow(ValidationError);
      await expect(plugin.getBranch('')).rejects.toThrow('Branch name is required');
    });

    it('rejects whitespace-only branch name', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.getBranch('  ')).rejects.toThrow(ValidationError);
    });

    it('delegates to doGetBranch with valid input', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      const result = await plugin.getBranch('main');
      expect(plugin.doGetBranch).toHaveBeenCalledWith('main');
      expect(result.name).toBe('main');
    });
  });

  // -- listBranches --

  describe('listBranches', () => {
    it('delegates directly without validation', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      const query: PaginatedQuery = { limit: 10, offset: 0 };
      await plugin.listBranches(query);
      expect(plugin.doListBranches).toHaveBeenCalledWith(query);
    });

    it('passes through undefined query', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await plugin.listBranches();
      expect(plugin.doListBranches).toHaveBeenCalledWith(undefined);
    });
  });

  // -- commit --

  describe('commit', () => {
    it('rejects empty commit message', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.commit({ message: '', files: ['a.ts'] })).rejects.toThrow(ValidationError);
      await expect(plugin.commit({ message: '', files: ['a.ts'] })).rejects.toThrow('Commit message is required');
    });

    it('rejects whitespace-only commit message', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.commit({ message: '   ', files: ['a.ts'] })).rejects.toThrow(ValidationError);
    });

    it('rejects empty files array', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.commit({ message: 'fix bug', files: [] })).rejects.toThrow(ValidationError);
      await expect(plugin.commit({ message: 'fix bug', files: [] })).rejects.toThrow('At least one file must be staged');
    });

    it('delegates to doCommit with valid input', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      const spec: CommitSpec = { message: 'fix bug', files: ['src/a.ts'] };
      const result = await plugin.commit(spec);
      expect(plugin.doCommit).toHaveBeenCalledWith(spec);
      expect(result.sha).toBe('def456');
    });
  });

  // -- getCommit --

  describe('getCommit', () => {
    it('rejects empty ref', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.getCommit('')).rejects.toThrow(ValidationError);
      await expect(plugin.getCommit('')).rejects.toThrow('Commit ref is required');
    });

    it('rejects whitespace-only ref', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.getCommit('  ')).rejects.toThrow(ValidationError);
    });

    it('delegates to doGetCommit with valid input', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      const result = await plugin.getCommit('abc123');
      expect(plugin.doGetCommit).toHaveBeenCalledWith('abc123');
      expect(result.sha).toBe('def456');
    });
  });

  // -- listCommits --

  describe('listCommits', () => {
    it('delegates directly without validation', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      const query: CommitQuery = { branch: 'main', limit: 10 };
      await plugin.listCommits(query);
      expect(plugin.doListCommits).toHaveBeenCalledWith(query);
    });
  });

  // -- getDiff --

  describe('getDiff', () => {
    it('rejects empty "from" ref', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.getDiff('', 'HEAD')).rejects.toThrow(ValidationError);
      await expect(plugin.getDiff('', 'HEAD')).rejects.toThrow('Diff "from" ref is required');
    });

    it('rejects whitespace-only "from" ref', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.getDiff('  ', 'HEAD')).rejects.toThrow(ValidationError);
    });

    it('rejects empty "to" ref', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.getDiff('main', '')).rejects.toThrow(ValidationError);
      await expect(plugin.getDiff('main', '')).rejects.toThrow('Diff "to" ref is required');
    });

    it('rejects whitespace-only "to" ref', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await expect(plugin.getDiff('main', '  ')).rejects.toThrow(ValidationError);
    });

    it('delegates to doGetDiff with valid input', async () => {
      const plugin = new TestSourceControlPlugin({ workingDirectory: '/repo' });
      await plugin.getDiff('main', 'feature/login');
      expect(plugin.doGetDiff).toHaveBeenCalledWith('main', 'feature/login');
    });
  });

  // -- ValidationError --

  describe('ValidationError', () => {
    it('has the correct error code', () => {
      const error = new ValidationError('test');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('has the correct name', () => {
      const error = new ValidationError('test');
      expect(error.name).toBe('ValidationError');
    });

    it('is an instance of Error', () => {
      const error = new ValidationError('test');
      expect(error).toBeInstanceOf(Error);
    });

    it('preserves the message', () => {
      const error = new ValidationError('Something went wrong');
      expect(error.message).toBe('Something went wrong');
    });
  });
});
