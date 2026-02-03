import { describe, it, expect } from 'vitest';
import type {
  AgentResult,
  AgentCapabilities,
  StreamChunk,
} from '@generacy-ai/latency';
import { FacetError } from '@generacy-ai/latency';
import {
  AbstractDevAgentPlugin,
  type InternalInvokeOptions,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Test subclass
// ---------------------------------------------------------------------------

class TestAgent extends AbstractDevAgentPlugin {
  /** Controls how long doInvoke takes (for timeout/cancellation tests). */
  invokeDelayMs = 0;

  /** Controls whether doInvoke throws. */
  invokeError: Error | null = null;

  /** Recorded prompts for assertion. */
  recordedPrompts: string[] = [];

  /** Recorded options for assertion. */
  recordedOptions: InternalInvokeOptions[] = [];

  /** Chunks to yield from streaming. */
  streamChunks: StreamChunk[] = [{ text: 'hello ' }, { text: 'world' }];

  /** Controls how long each stream chunk takes. */
  streamChunkDelayMs = 0;

  protected async doInvoke(
    prompt: string,
    options: InternalInvokeOptions,
  ): Promise<AgentResult> {
    this.recordedPrompts.push(prompt);
    this.recordedOptions.push(options);

    if (this.invokeError) {
      throw this.invokeError;
    }

    if (this.invokeDelayMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, this.invokeDelayMs);
        options.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(options.signal.reason);
        });
      });
    }

    return {
      output: `result: ${prompt}`,
      invocationId: options.invocationId,
      usage: { inputTokens: 10, outputTokens: 20 },
    };
  }

  protected async *doInvokeStream(
    prompt: string,
    options: InternalInvokeOptions,
  ): AsyncIterableIterator<StreamChunk> {
    this.recordedPrompts.push(prompt);
    this.recordedOptions.push(options);

    for (const chunk of this.streamChunks) {
      if (options.signal.aborted) {
        throw options.signal.reason;
      }

      if (this.streamChunkDelayMs > 0) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, this.streamChunkDelayMs);
          options.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(options.signal.reason);
          });
        });
      }

      yield chunk;
    }
  }

  protected async doGetCapabilities(): Promise<AgentCapabilities> {
    return {
      streaming: true,
      cancellation: true,
      models: ['test-model-1', 'test-model-2'],
    };
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AbstractDevAgentPlugin', () => {
  describe('invoke', () => {
    it('should return a result with an invocationId', async () => {
      const agent = new TestAgent();
      const result = await agent.invoke('fix the bug');

      expect(result.output).toBe('result: fix the bug');
      expect(result.invocationId).toMatch(/^inv_\d+_[a-z0-9]+$/);
      expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 20 });
    });

    it('should pass the prompt to doInvoke', async () => {
      const agent = new TestAgent();
      await agent.invoke('write tests');

      expect(agent.recordedPrompts).toEqual(['write tests']);
    });

    it('should pass metadata through to doInvoke', async () => {
      const agent = new TestAgent();
      await agent.invoke('refactor', { metadata: { key: 'value' } });

      expect(agent.recordedOptions[0].metadata).toEqual({ key: 'value' });
    });

    it('should throw FacetError with VALIDATION code for empty prompt', async () => {
      const agent = new TestAgent();

      await expect(agent.invoke('')).rejects.toThrow(FacetError);
      await expect(agent.invoke('')).rejects.toMatchObject({
        code: 'VALIDATION',
      });
    });

    it('should throw FacetError with VALIDATION code for whitespace-only prompt', async () => {
      const agent = new TestAgent();

      await expect(agent.invoke('   ')).rejects.toThrow(FacetError);
      await expect(agent.invoke('   ')).rejects.toMatchObject({
        code: 'VALIDATION',
      });
    });

    it('should throw FacetError with TIMEOUT code when invocation exceeds timeout', async () => {
      const agent = new TestAgent({ defaultTimeoutMs: 50 });
      agent.invokeDelayMs = 500;

      await expect(agent.invoke('slow task')).rejects.toThrow(FacetError);
      await expect(
        agent.invoke('slow task'),
      ).rejects.toMatchObject({ code: 'TIMEOUT' });
    });

    it('should use per-invocation timeout over default', async () => {
      const agent = new TestAgent({ defaultTimeoutMs: 5000 });
      agent.invokeDelayMs = 500;

      await expect(
        agent.invoke('slow task', { timeoutMs: 50 }),
      ).rejects.toThrow(FacetError);
      await expect(
        agent.invoke('slow task', { timeoutMs: 50 }),
      ).rejects.toMatchObject({ code: 'TIMEOUT' });
    });

    it('should throw FacetError with CANCELLED code when cancelled', async () => {
      const agent = new TestAgent();
      agent.invokeDelayMs = 500;

      const promise = agent.invoke('long task');

      // Cancel after a short delay
      await new Promise((r) => setTimeout(r, 10));
      const invocationId = agent.recordedOptions[0].invocationId;
      await agent.cancel(invocationId);

      await expect(promise).rejects.toThrow(FacetError);
      await expect(promise).rejects.toMatchObject({ code: 'CANCELLED' });
    });

    it('should support external abort signal', async () => {
      const agent = new TestAgent();
      agent.invokeDelayMs = 500;

      const controller = new AbortController();
      const promise = agent.invoke('long task', { signal: controller.signal });

      await new Promise((r) => setTimeout(r, 10));
      controller.abort();

      await expect(promise).rejects.toThrow(FacetError);
      await expect(promise).rejects.toMatchObject({ code: 'CANCELLED' });
    });

    it('should track concurrent invocations independently', async () => {
      const agent = new TestAgent();
      agent.invokeDelayMs = 50;

      const [result1, result2] = await Promise.all([
        agent.invoke('task 1'),
        agent.invoke('task 2'),
      ]);

      expect(result1.output).toBe('result: task 1');
      expect(result2.output).toBe('result: task 2');
      expect(result1.invocationId).not.toBe(result2.invocationId);
    });
  });

  describe('invokeStream', () => {
    it('should yield stream chunks', async () => {
      const agent = new TestAgent();
      const chunks: StreamChunk[] = [];

      for await (const chunk of agent.invokeStream('stream this')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([{ text: 'hello ' }, { text: 'world' }]);
    });

    it('should throw FacetError with VALIDATION code for empty prompt', () => {
      const agent = new TestAgent();

      expect(() => agent.invokeStream('')).toThrow(FacetError);
      expect(() => agent.invokeStream('')).toThrow(
        expect.objectContaining({ code: 'VALIDATION' }),
      );
    });

    it('should respect timeout during streaming', async () => {
      const agent = new TestAgent({ defaultTimeoutMs: 50 });
      agent.streamChunkDelayMs = 200;

      const chunks: StreamChunk[] = [];

      await expect(async () => {
        for await (const chunk of agent.invokeStream('stream slow')) {
          chunks.push(chunk);
        }
      }).rejects.toMatchObject({ code: 'TIMEOUT' });
    });

    it('should respect cancellation during streaming', async () => {
      const agent = new TestAgent();
      agent.streamChunkDelayMs = 200;

      const chunks: StreamChunk[] = [];
      const iterator = agent.invokeStream('stream cancel');

      // Get first chunk
      const first = await iterator.next();
      expect(first.done).toBe(false);
      chunks.push(first.value);

      // Cancel the invocation
      const invocationId = agent.recordedOptions[0].invocationId;
      await agent.cancel(invocationId);

      // Next iteration should throw
      await expect(iterator.next()).rejects.toMatchObject({
        code: 'CANCELLED',
      });
    });
  });

  describe('cancel', () => {
    it('should be a no-op for unknown invocation ids', async () => {
      const agent = new TestAgent();

      // Should not throw
      await agent.cancel('nonexistent_id');
    });
  });

  describe('getCapabilities', () => {
    it('should return capabilities from doGetCapabilities', async () => {
      const agent = new TestAgent();
      const caps = await agent.getCapabilities();

      expect(caps).toEqual({
        streaming: true,
        cancellation: true,
        models: ['test-model-1', 'test-model-2'],
      });
    });
  });
});
