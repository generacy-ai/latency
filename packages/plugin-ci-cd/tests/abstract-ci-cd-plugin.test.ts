import { describe, it, expect, vi } from 'vitest';
import { FacetError } from '@generacy-ai/latency';
import type { Pipeline, PipelineRun, TriggerOptions } from '@generacy-ai/latency';
import { AbstractCICDPlugin } from '../src/abstract-ci-cd-plugin.js';

// ---------------------------------------------------------------------------
// Test subclass – implements abstract methods with vi.fn() mocks
// ---------------------------------------------------------------------------

class TestCICDPlugin extends AbstractCICDPlugin {
  doTrigger = vi.fn<(pipelineId: string, options?: TriggerOptions) => Promise<PipelineRun>>();
  doGetStatus = vi.fn<(runId: string) => Promise<PipelineRun>>();
  doCancel = vi.fn<(runId: string) => Promise<void>>();
  doListPipelines = vi.fn<() => Promise<Pipeline[]>>();
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const mockRun: PipelineRun = {
  id: 'run-1',
  pipelineId: 'pipeline-1',
  status: 'running',
  createdAt: new Date(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AbstractCICDPlugin', () => {
  // -----------------------------------------------------------------------
  // triggerPipeline
  // -----------------------------------------------------------------------
  describe('triggerPipeline', () => {
    it('throws FacetError with VALIDATION_ERROR for empty string', async () => {
      const plugin = new TestCICDPlugin();

      await expect(plugin.triggerPipeline('')).rejects.toThrow(FacetError);
      await expect(plugin.triggerPipeline('')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('throws FacetError with VALIDATION_ERROR for whitespace-only string', async () => {
      const plugin = new TestCICDPlugin();

      await expect(plugin.triggerPipeline('   ')).rejects.toThrow(FacetError);
      await expect(plugin.triggerPipeline('   ')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('throws FacetError with VALIDATION_ERROR for null/undefined passed as any', async () => {
      const plugin = new TestCICDPlugin();

      await expect(plugin.triggerPipeline(null as any)).rejects.toThrow(FacetError);
      await expect(plugin.triggerPipeline(null as any)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });

      await expect(plugin.triggerPipeline(undefined as any)).rejects.toThrow(FacetError);
      await expect(plugin.triggerPipeline(undefined as any)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('delegates to doTrigger with correct args on valid ID', async () => {
      const plugin = new TestCICDPlugin();
      plugin.doTrigger.mockResolvedValue(mockRun);

      const result = await plugin.triggerPipeline('pipeline-1');

      expect(plugin.doTrigger).toHaveBeenCalledWith('pipeline-1', undefined);
      expect(result).toBe(mockRun);
    });

    it('passes options through to doTrigger', async () => {
      const plugin = new TestCICDPlugin();
      plugin.doTrigger.mockResolvedValue(mockRun);

      const options: TriggerOptions = {
        branch: 'feature/login',
        parameters: { deploy_env: 'staging' },
        environment: { NODE_ENV: 'test' },
      };

      const result = await plugin.triggerPipeline('pipeline-1', options);

      expect(plugin.doTrigger).toHaveBeenCalledWith('pipeline-1', options);
      expect(result).toBe(mockRun);
    });
  });

  // -----------------------------------------------------------------------
  // getPipelineStatus
  // -----------------------------------------------------------------------
  describe('getPipelineStatus', () => {
    it('throws FacetError with VALIDATION_ERROR for empty string', async () => {
      const plugin = new TestCICDPlugin();

      await expect(plugin.getPipelineStatus('')).rejects.toThrow(FacetError);
      await expect(plugin.getPipelineStatus('')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('delegates to doGetStatus on valid ID', async () => {
      const plugin = new TestCICDPlugin();
      plugin.doGetStatus.mockResolvedValue(mockRun);

      const result = await plugin.getPipelineStatus('run-1');

      expect(plugin.doGetStatus).toHaveBeenCalledWith('run-1');
      expect(result).toBe(mockRun);
    });
  });

  // -----------------------------------------------------------------------
  // cancelPipeline
  // -----------------------------------------------------------------------
  describe('cancelPipeline', () => {
    it('throws FacetError with VALIDATION_ERROR for empty string', async () => {
      const plugin = new TestCICDPlugin();

      await expect(plugin.cancelPipeline('')).rejects.toThrow(FacetError);
      await expect(plugin.cancelPipeline('')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('delegates to doCancel on valid ID', async () => {
      const plugin = new TestCICDPlugin();
      plugin.doCancel.mockResolvedValue(undefined);

      await plugin.cancelPipeline('run-1');

      expect(plugin.doCancel).toHaveBeenCalledWith('run-1');
    });
  });

  // -----------------------------------------------------------------------
  // listPipelines
  // -----------------------------------------------------------------------
  describe('listPipelines', () => {
    it('delegates to doListPipelines', async () => {
      const plugin = new TestCICDPlugin();
      const mockPipelines: Pipeline[] = [
        { id: 'p-1', name: 'Build & Test' },
        { id: 'p-2', name: 'Deploy', description: 'Deploy to production', defaultBranch: 'main' },
      ];
      plugin.doListPipelines.mockResolvedValue(mockPipelines);

      const result = await plugin.listPipelines();

      expect(plugin.doListPipelines).toHaveBeenCalled();
      expect(result).toBe(mockPipelines);
    });
  });
});
