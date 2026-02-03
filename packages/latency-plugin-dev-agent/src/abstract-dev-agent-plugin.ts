/**
 * Abstract base class for AI development agent plugins.
 *
 * Provides common invocation lifecycle management including input validation,
 * invocation tracking, timeout handling, cancellation, and streaming support.
 * Concrete implementations extend this class and implement the abstract
 * methods for their specific agent backend.
 *
 * @module abstract-dev-agent-plugin
 *
 * @example
 * ```typescript
 * import { AbstractDevAgentPlugin } from '@generacy-ai/latency-plugin-dev-agent';
 * import type { AgentResult, AgentCapabilities, StreamChunk } from '@generacy-ai/latency';
 * import type { InternalInvokeOptions } from '@generacy-ai/latency-plugin-dev-agent';
 *
 * class MyAgent extends AbstractDevAgentPlugin {
 *   protected async doInvoke(
 *     prompt: string,
 *     options: InternalInvokeOptions,
 *   ): Promise<AgentResult> {
 *     // Call your agent API here
 *     return { output: 'done', invocationId: options.invocationId };
 *   }
 *
 *   protected async *doInvokeStream(
 *     prompt: string,
 *     options: InternalInvokeOptions,
 *   ): AsyncIterableIterator<StreamChunk> {
 *     yield { text: 'streaming...' };
 *   }
 *
 *   protected async doGetCapabilities(): Promise<AgentCapabilities> {
 *     return { streaming: true, cancellation: true, models: ['my-model'] };
 *   }
 * }
 * ```
 */

import type {
  DevAgent,
  InvokeOptions,
  AgentResult,
  AgentCapabilities,
  StreamChunk,
} from '@generacy-ai/latency';
import { FacetError } from '@generacy-ai/latency';

// ---------------------------------------------------------------------------
// Configuration types
// ---------------------------------------------------------------------------

/**
 * Options for constructing an {@link AbstractDevAgentPlugin}.
 */
export interface AbstractDevAgentOptions {
  /**
   * Default timeout in milliseconds for invocations.
   *
   * Can be overridden per-invocation via {@link InvokeOptions.timeoutMs}.
   * Defaults to 30 000 ms (30 seconds).
   */
  defaultTimeoutMs?: number;
}

/**
 * Internal invocation options passed to abstract methods.
 *
 * Extends {@link InvokeOptions} with the generated invocation identifier
 * and a merged abort signal that covers both timeout and external cancellation.
 */
export interface InternalInvokeOptions extends InvokeOptions {
  /** Unique identifier for this invocation. */
  invocationId: string;

  /**
   * Merged abort signal covering timeout, manual cancellation, and any
   * external signal provided by the caller.
   */
  signal: AbortSignal;
}

// ---------------------------------------------------------------------------
// Abstract class
// ---------------------------------------------------------------------------

/**
 * Abstract base implementation of {@link DevAgent}.
 *
 * Handles invocation tracking, timeout management, input validation, and
 * cancellation. Subclasses implement the agent-specific logic via the
 * protected abstract methods.
 */
export abstract class AbstractDevAgentPlugin implements DevAgent {
  private readonly defaultTimeoutMs: number;
  private readonly activeInvocations = new Map<string, AbortController>();

  constructor(options?: AbstractDevAgentOptions) {
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 30_000;
  }

  /**
   * Invoke the agent with a prompt and wait for the complete result.
   *
   * Validates input, sets up invocation tracking and timeout, then
   * delegates to {@link AbstractDevAgentPlugin.doInvoke}.
   */
  async invoke(prompt: string, options?: InvokeOptions): Promise<AgentResult> {
    this.validatePrompt(prompt);

    const invocationId = this.generateInvocationId();
    const controller = new AbortController();
    this.activeInvocations.set(invocationId, controller);

    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const mergedSignal = this.mergeSignals(
      controller.signal,
      timeoutMs,
      options?.signal,
    );

    try {
      const result = await this.doInvoke(prompt, {
        ...options,
        invocationId,
        signal: mergedSignal,
      });
      return result;
    } catch (error: unknown) {
      throw this.normalizeError(error, mergedSignal);
    } finally {
      this.activeInvocations.delete(invocationId);
    }
  }

  /**
   * Invoke the agent with a prompt and stream the response.
   *
   * Validates input, sets up invocation tracking and timeout, then
   * delegates to {@link AbstractDevAgentPlugin.doInvokeStream}. The
   * returned iterator is wrapped with cleanup logic.
   */
  invokeStream(
    prompt: string,
    options?: InvokeOptions,
  ): AsyncIterableIterator<StreamChunk> {
    this.validatePrompt(prompt);

    const invocationId = this.generateInvocationId();
    const controller = new AbortController();
    this.activeInvocations.set(invocationId, controller);

    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const mergedSignal = this.mergeSignals(
      controller.signal,
      timeoutMs,
      options?.signal,
    );

    const innerIterator = this.doInvokeStream(prompt, {
      ...options,
      invocationId,
      signal: mergedSignal,
    });

    const self = this;
    const wrappedIterator: AsyncIterableIterator<StreamChunk> = {
      [Symbol.asyncIterator]() {
        return wrappedIterator;
      },
      async next() {
        try {
          if (mergedSignal.aborted) {
            throw self.normalizeError(mergedSignal.reason, mergedSignal);
          }
          const result = await innerIterator.next();
          if (result.done) {
            self.activeInvocations.delete(invocationId);
          }
          return result;
        } catch (error: unknown) {
          self.activeInvocations.delete(invocationId);
          throw self.normalizeError(error, mergedSignal);
        }
      },
      async return(value?: StreamChunk) {
        self.activeInvocations.delete(invocationId);
        if (innerIterator.return) {
          return innerIterator.return(value);
        }
        return { done: true as const, value: undefined as unknown as StreamChunk };
      },
      async throw(error?: unknown) {
        self.activeInvocations.delete(invocationId);
        if (innerIterator.throw) {
          return innerIterator.throw(error);
        }
        throw error;
      },
    };

    return wrappedIterator;
  }

  /**
   * Cancel an in-flight invocation by its identifier.
   *
   * Aborts the associated controller and removes the tracking entry.
   * If the invocation has already completed or does not exist, this is a no-op.
   */
  async cancel(invocationId: string): Promise<void> {
    const controller = this.activeInvocations.get(invocationId);
    if (controller) {
      controller.abort();
      this.activeInvocations.delete(invocationId);
    }
  }

  /**
   * Query the capabilities of this agent implementation.
   *
   * Delegates to {@link AbstractDevAgentPlugin.doGetCapabilities}.
   */
  async getCapabilities(): Promise<AgentCapabilities> {
    return this.doGetCapabilities();
  }

  // -------------------------------------------------------------------------
  // Abstract methods for subclasses
  // -------------------------------------------------------------------------

  /**
   * Perform the actual agent invocation.
   *
   * Subclasses implement this method with their agent-specific logic.
   * The signal on options should be respected for cancellation.
   */
  protected abstract doInvoke(
    prompt: string,
    options: InternalInvokeOptions,
  ): Promise<AgentResult>;

  /**
   * Perform the actual streaming agent invocation.
   *
   * Subclasses implement this method to return an async iterator that
   * yields chunks as the agent produces output.
   */
  protected abstract doInvokeStream(
    prompt: string,
    options: InternalInvokeOptions,
  ): AsyncIterableIterator<StreamChunk>;

  /**
   * Return the capabilities of this agent implementation.
   */
  protected abstract doGetCapabilities(): Promise<AgentCapabilities>;

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private validatePrompt(prompt: string): void {
    if (!prompt?.trim()) {
      throw new FacetError('Prompt is required', 'VALIDATION');
    }
  }

  private generateInvocationId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Merge the cancellation controller signal with a timeout signal and an
   * optional external signal into a single composite signal.
   */
  private mergeSignals(
    cancelSignal: AbortSignal,
    timeoutMs: number,
    externalSignal?: AbortSignal,
  ): AbortSignal {
    const signals: AbortSignal[] = [
      cancelSignal,
      AbortSignal.timeout(timeoutMs),
    ];

    if (externalSignal) {
      signals.push(externalSignal);
    }

    return AbortSignal.any(signals);
  }

  /**
   * Normalize errors from invocations into FacetError instances with
   * appropriate error codes.
   */
  private normalizeError(error: unknown, signal: AbortSignal): FacetError {
    if (error instanceof FacetError) {
      return error;
    }

    if (signal.aborted) {
      const reason = signal.reason;
      if (reason instanceof DOMException && reason.name === 'TimeoutError') {
        return new FacetError('Invocation timed out', 'TIMEOUT', {
          cause: error,
        });
      }
      return new FacetError('Invocation was cancelled', 'CANCELLED', {
        cause: error,
      });
    }

    if (error instanceof Error) {
      return new FacetError(error.message, 'UNKNOWN', { cause: error });
    }

    return new FacetError(String(error), 'UNKNOWN', { cause: error });
  }
}
