import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FacetError } from '@generacy-ai/latency';
import type { PipelineRun } from '@generacy-ai/latency';
import {
  isGitHubWorkflowRun,
  isGitHubJob,
  getWorkflowRunUrl,
} from '@generacy-ai/github-actions-interface';
import { GitHubActionsPlugin } from '../src/github-actions-plugin.js';
import type { GitHubActionsConfig } from '../src/config.js';

// ---------------------------------------------------------------------------
// Mock Octokit
// ---------------------------------------------------------------------------

const mockActions = {
  createWorkflowDispatch: vi.fn(),
  getWorkflowRun: vi.fn(),
  listJobsForWorkflowRun: vi.fn(),
  cancelWorkflowRun: vi.fn(),
  listRepoWorkflows: vi.fn(),
  downloadWorkflowRunLogs: vi.fn(),
  reRunWorkflow: vi.fn(),
  listWorkflowRunArtifacts: vi.fn(),
  downloadArtifact: vi.fn(),
};

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    actions: mockActions,
  })),
}));

const { Octokit } = await import('@octokit/rest');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const defaultConfig: GitHubActionsConfig = {
  token: 'ghp_test_token',
  owner: 'test-owner',
  repo: 'test-repo',
};

const mockWorkflowRunData = {
  id: 12345,
  workflow_id: 100,
  status: 'completed',
  conclusion: 'success',
  created_at: '2025-06-01T10:00:00Z',
  run_started_at: '2025-06-01T10:00:05Z',
  updated_at: '2025-06-01T10:05:00Z',
  logs_url: 'https://api.github.com/repos/test-owner/test-repo/actions/runs/12345/logs',
  run_number: 42,
  run_attempt: 1,
  head_sha: 'abc123def456',
  head_branch: 'main',
  triggering_actor: { login: 'test-user' },
};

const mockJobData = {
  id: 999,
  name: 'build',
  status: 'completed' as const,
  conclusion: 'success' as const,
  started_at: '2025-06-01T10:00:10Z',
  completed_at: '2025-06-01T10:04:00Z',
  steps: [
    {
      number: 1,
      name: 'Checkout',
      status: 'completed' as const,
      conclusion: 'success' as const,
      started_at: '2025-06-01T10:00:10Z',
      completed_at: '2025-06-01T10:00:15Z',
    },
    {
      number: 2,
      name: 'Build',
      status: 'completed' as const,
      conclusion: 'success' as const,
      started_at: '2025-06-01T10:00:15Z',
      completed_at: '2025-06-01T10:04:00Z',
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GitHubActionsPlugin', () => {
  let plugin: GitHubActionsPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    plugin = new GitHubActionsPlugin(defaultConfig);
  });

  // -----------------------------------------------------------------------
  // Constructor (T022)
  // -----------------------------------------------------------------------
  describe('constructor', () => {
    it('initializes Octokit with the provided token', () => {
      new GitHubActionsPlugin(defaultConfig);
      expect(Octokit).toHaveBeenCalledWith({ auth: 'ghp_test_token' });
    });

    it('passes apiBaseUrl when provided', () => {
      new GitHubActionsPlugin({
        ...defaultConfig,
        apiBaseUrl: 'https://github.example.com/api/v3',
      });
      expect(Octokit).toHaveBeenCalledWith({
        auth: 'ghp_test_token',
        baseUrl: 'https://github.example.com/api/v3',
      });
    });
  });

  // -----------------------------------------------------------------------
  // doTrigger (T023)
  // -----------------------------------------------------------------------
  describe('triggerPipeline', () => {
    it('calls createWorkflowDispatch with mapped options', async () => {
      mockActions.createWorkflowDispatch.mockResolvedValue({ status: 204 });

      const result = await plugin.triggerPipeline('ci.yml', {
        branch: 'feature/test',
        parameters: { deploy_env: 'staging' },
      });

      expect(mockActions.createWorkflowDispatch).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        workflow_id: 'ci.yml',
        ref: 'feature/test',
        inputs: { deploy_env: 'staging' },
      });

      expect(result.pipelineId).toBe('ci.yml');
      expect(result.status).toBe('pending');
      expect(result.id).toMatch(/^dispatch-\d+$/);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('defaults ref to main when no branch provided', async () => {
      mockActions.createWorkflowDispatch.mockResolvedValue({ status: 204 });

      await plugin.triggerPipeline('ci.yml');

      expect(mockActions.createWorkflowDispatch).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        workflow_id: 'ci.yml',
        ref: 'main',
        inputs: undefined,
      });
    });
  });

  // -----------------------------------------------------------------------
  // doGetStatus (T024)
  // -----------------------------------------------------------------------
  describe('getPipelineStatus', () => {
    it('calls getWorkflowRun and listJobsForWorkflowRun, returns mapped result', async () => {
      mockActions.getWorkflowRun.mockResolvedValue({ data: mockWorkflowRunData });
      mockActions.listJobsForWorkflowRun.mockResolvedValue({
        data: { jobs: [mockJobData] },
      });

      const result = await plugin.getPipelineStatus('12345');

      expect(mockActions.getWorkflowRun).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        run_id: 12345,
      });
      expect(mockActions.listJobsForWorkflowRun).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        run_id: 12345,
      });

      expect(result.id).toBe('12345');
      expect(result.pipelineId).toBe('100');
      expect(result.status).toBe('completed');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('maps queued status to pending', async () => {
      mockActions.getWorkflowRun.mockResolvedValue({
        data: { ...mockWorkflowRunData, status: 'queued', conclusion: null },
      });
      mockActions.listJobsForWorkflowRun.mockResolvedValue({
        data: { jobs: [] },
      });

      const result = await plugin.getPipelineStatus('12345');
      expect(result.status).toBe('pending');
    });

    it('maps in_progress status to running', async () => {
      mockActions.getWorkflowRun.mockResolvedValue({
        data: { ...mockWorkflowRunData, status: 'in_progress', conclusion: null },
      });
      mockActions.listJobsForWorkflowRun.mockResolvedValue({
        data: { jobs: [] },
      });

      const result = await plugin.getPipelineStatus('12345');
      expect(result.status).toBe('running');
    });

    it('maps completed/failure to failed', async () => {
      mockActions.getWorkflowRun.mockResolvedValue({
        data: { ...mockWorkflowRunData, status: 'completed', conclusion: 'failure' },
      });
      mockActions.listJobsForWorkflowRun.mockResolvedValue({
        data: { jobs: [] },
      });

      const result = await plugin.getPipelineStatus('12345');
      expect(result.status).toBe('failed');
    });

    it('maps completed/timed_out to failed', async () => {
      mockActions.getWorkflowRun.mockResolvedValue({
        data: { ...mockWorkflowRunData, status: 'completed', conclusion: 'timed_out' },
      });
      mockActions.listJobsForWorkflowRun.mockResolvedValue({
        data: { jobs: [] },
      });

      const result = await plugin.getPipelineStatus('12345');
      expect(result.status).toBe('failed');
    });

    it('maps completed/cancelled to cancelled', async () => {
      mockActions.getWorkflowRun.mockResolvedValue({
        data: { ...mockWorkflowRunData, status: 'completed', conclusion: 'cancelled' },
      });
      mockActions.listJobsForWorkflowRun.mockResolvedValue({
        data: { jobs: [] },
      });

      const result = await plugin.getPipelineStatus('12345');
      expect(result.status).toBe('cancelled');
    });

    it('maps completed/skipped to completed', async () => {
      mockActions.getWorkflowRun.mockResolvedValue({
        data: { ...mockWorkflowRunData, status: 'completed', conclusion: 'skipped' },
      });
      mockActions.listJobsForWorkflowRun.mockResolvedValue({
        data: { jobs: [] },
      });

      const result = await plugin.getPipelineStatus('12345');
      expect(result.status).toBe('completed');
    });

    it('maps completed/action_required to running', async () => {
      mockActions.getWorkflowRun.mockResolvedValue({
        data: { ...mockWorkflowRunData, status: 'completed', conclusion: 'action_required' },
      });
      mockActions.listJobsForWorkflowRun.mockResolvedValue({
        data: { jobs: [] },
      });

      const result = await plugin.getPipelineStatus('12345');
      expect(result.status).toBe('running');
    });

    it('maps jobs and steps correctly', async () => {
      mockActions.getWorkflowRun.mockResolvedValue({ data: mockWorkflowRunData });
      mockActions.listJobsForWorkflowRun.mockResolvedValue({
        data: { jobs: [mockJobData] },
      });

      const result = (await plugin.getPipelineStatus('12345')) as unknown as {
        jobs: Array<{
          id: number;
          name: string;
          status: string;
          conclusion: string;
          steps: Array<{ number: number; name: string }>;
        }>;
      };

      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0]!.id).toBe(999);
      expect(result.jobs[0]!.name).toBe('build');
      expect(result.jobs[0]!.steps).toHaveLength(2);
      expect(result.jobs[0]!.steps[0]!.name).toBe('Checkout');
      expect(result.jobs[0]!.steps[1]!.name).toBe('Build');
    });
  });

  // -----------------------------------------------------------------------
  // doCancel (T025)
  // -----------------------------------------------------------------------
  describe('cancelPipeline', () => {
    it('calls cancelWorkflowRun with correct owner/repo/run_id', async () => {
      mockActions.cancelWorkflowRun.mockResolvedValue({ status: 202 });

      await plugin.cancelPipeline('12345');

      expect(mockActions.cancelWorkflowRun).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        run_id: 12345,
      });
    });
  });

  // -----------------------------------------------------------------------
  // doListPipelines (T026)
  // -----------------------------------------------------------------------
  describe('listPipelines', () => {
    it('calls listRepoWorkflows and maps response', async () => {
      mockActions.listRepoWorkflows.mockResolvedValue({
        data: {
          workflows: [
            {
              id: 100,
              name: 'CI',
              path: '.github/workflows/ci.yml',
              state: 'active',
            },
            {
              id: 200,
              name: 'Deploy',
              path: '.github/workflows/deploy.yml',
              state: 'disabled_manually',
            },
          ],
        },
      });

      const result = await plugin.listPipelines();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '100',
        name: 'CI',
        path: '.github/workflows/ci.yml',
        state: 'active',
        triggers: [],
      });
      expect(result[1]).toEqual({
        id: '200',
        name: 'Deploy',
        path: '.github/workflows/deploy.yml',
        state: 'disabled_manually',
        triggers: [],
      });
    });
  });

  // -----------------------------------------------------------------------
  // GitHub-specific methods (T027)
  // -----------------------------------------------------------------------
  describe('getWorkflowLogs', () => {
    it('calls downloadWorkflowRunLogs and returns data', async () => {
      mockActions.downloadWorkflowRunLogs.mockResolvedValue({
        data: 'log content here',
      });

      const result = await plugin.getWorkflowLogs(12345);

      expect(mockActions.downloadWorkflowRunLogs).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        run_id: 12345,
      });
      expect(result).toBe('log content here');
    });
  });

  describe('rerunWorkflow', () => {
    it('calls reRunWorkflow then fetches updated run', async () => {
      mockActions.reRunWorkflow.mockResolvedValue({ status: 201 });
      mockActions.getWorkflowRun.mockResolvedValue({
        data: { ...mockWorkflowRunData, status: 'queued', conclusion: null },
      });
      mockActions.listJobsForWorkflowRun.mockResolvedValue({
        data: { jobs: [] },
      });

      const result = await plugin.rerunWorkflow(12345);

      expect(mockActions.reRunWorkflow).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        run_id: 12345,
      });
      expect(result.status).toBe('pending');
      expect(result.workflowId).toBe(100);
    });
  });

  describe('listArtifacts', () => {
    it('calls listWorkflowRunArtifacts and maps response', async () => {
      mockActions.listWorkflowRunArtifacts.mockResolvedValue({
        data: {
          artifacts: [
            {
              id: 501,
              name: 'build-output',
              size_in_bytes: 1024,
              archive_download_url: 'https://api.github.com/artifacts/501/zip',
              expired: false,
              created_at: '2025-06-01T10:05:00Z',
              expires_at: '2025-07-01T10:05:00Z',
            },
          ],
        },
      });

      const result = await plugin.listArtifacts(12345);

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(501);
      expect(result[0]!.name).toBe('build-output');
      expect(result[0]!.sizeInBytes).toBe(1024);
      expect(result[0]!.expired).toBe(false);
      expect(result[0]!.createdAt).toBeInstanceOf(Date);
      expect(result[0]!.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('downloadArtifact', () => {
    it('calls downloadArtifact and returns Buffer', async () => {
      const testData = new ArrayBuffer(8);
      mockActions.downloadArtifact.mockResolvedValue({ data: testData });

      const result = await plugin.downloadArtifact(501);

      expect(mockActions.downloadArtifact).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        artifact_id: 501,
        archive_format: 'zip',
      });
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Error handling (T028)
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('maps 401 to FacetError with AUTH code', async () => {
      mockActions.listRepoWorkflows.mockRejectedValue({
        status: 401,
        message: 'Bad credentials',
      });

      await expect(plugin.listPipelines()).rejects.toThrow(FacetError);
      await expect(plugin.listPipelines()).rejects.toMatchObject({
        code: 'AUTH',
      });
    });

    it('maps 403 to FacetError with AUTH code', async () => {
      mockActions.listRepoWorkflows.mockRejectedValue({
        status: 403,
        message: 'Forbidden',
      });

      await expect(plugin.listPipelines()).rejects.toThrow(FacetError);
      await expect(plugin.listPipelines()).rejects.toMatchObject({
        code: 'AUTH',
      });
    });

    it('maps 404 to FacetError with NOT_FOUND code', async () => {
      mockActions.getWorkflowRun.mockRejectedValue({
        status: 404,
        message: 'Not Found',
      });

      await expect(plugin.getPipelineStatus('99999')).rejects.toThrow(FacetError);
      await expect(plugin.getPipelineStatus('99999')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('maps 422 to FacetError with VALIDATION_ERROR code', async () => {
      mockActions.createWorkflowDispatch.mockRejectedValue({
        status: 422,
        message: 'Unprocessable Entity',
      });

      await expect(plugin.triggerPipeline('bad-workflow')).rejects.toThrow(FacetError);
      await expect(plugin.triggerPipeline('bad-workflow')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('maps other status codes to FacetError with PROVIDER_ERROR code', async () => {
      mockActions.listRepoWorkflows.mockRejectedValue({
        status: 500,
        message: 'Internal Server Error',
      });

      await expect(plugin.listPipelines()).rejects.toThrow(FacetError);
      await expect(plugin.listPipelines()).rejects.toMatchObject({
        code: 'PROVIDER_ERROR',
      });
    });

    it('wraps non-HTTP errors as PROVIDER_ERROR', async () => {
      mockActions.listRepoWorkflows.mockRejectedValue(new Error('Network error'));

      await expect(plugin.listPipelines()).rejects.toThrow(FacetError);
      await expect(plugin.listPipelines()).rejects.toMatchObject({
        code: 'PROVIDER_ERROR',
        message: 'Network error',
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Type guards and helpers tests (T029, T030)
// ---------------------------------------------------------------------------

describe('type guards', () => {
  const basePipelineRun: PipelineRun = {
    id: 'run-1',
    pipelineId: 'pipeline-1',
    status: 'running',
    createdAt: new Date(),
  };

  describe('isGitHubWorkflowRun', () => {
    it('returns true for a valid GitHubWorkflowRun', () => {
      const githubRun = {
        ...basePipelineRun,
        workflowId: 100,
        runNumber: 42,
        attempt: 1,
        triggeredBy: 'user',
        headSha: 'abc123',
        headBranch: 'main',
        jobs: [],
      };
      expect(isGitHubWorkflowRun(githubRun)).toBe(true);
    });

    it('returns false for a generic PipelineRun', () => {
      expect(isGitHubWorkflowRun(basePipelineRun)).toBe(false);
    });

    it('returns false when missing workflowId', () => {
      const partial = {
        ...basePipelineRun,
        runNumber: 42,
        headSha: 'abc123',
      };
      expect(isGitHubWorkflowRun(partial as PipelineRun)).toBe(false);
    });
  });

  describe('isGitHubJob', () => {
    it('returns true for a valid GitHubJob', () => {
      expect(
        isGitHubJob({
          id: 1,
          name: 'build',
          status: 'completed',
          conclusion: 'success',
          steps: [],
        }),
      ).toBe(true);
    });

    it('returns false for null', () => {
      expect(isGitHubJob(null)).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(isGitHubJob('string')).toBe(false);
    });

    it('returns false for object missing required fields', () => {
      expect(isGitHubJob({ id: 1, name: 'build' })).toBe(false);
    });
  });
});

describe('helpers', () => {
  describe('getWorkflowRunUrl', () => {
    it('generates correct URL format', () => {
      const run = {
        id: '12345',
        pipelineId: '100',
        status: 'completed' as const,
        createdAt: new Date(),
        workflowId: 100,
        runNumber: 42,
        attempt: 1,
        triggeredBy: 'user',
        headSha: 'abc123',
        headBranch: 'main',
        jobs: [],
      };

      expect(getWorkflowRunUrl(run, 'my-org', 'my-repo')).toBe(
        'https://github.com/my-org/my-repo/actions/runs/12345',
      );
    });
  });
});
