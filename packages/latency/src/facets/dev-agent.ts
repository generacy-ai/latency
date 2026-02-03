/**
 * Abstract interface for AI development agent systems.
 *
 * Defines a provider-agnostic API for invoking AI agents, streaming
 * responses, tracking invocations, and managing cancellation. Implementations
 * can target any AI agent backend such as Claude Code, GitHub Copilot,
 * Cursor, Windsurf, or other LLM-powered development tools.
 *
 * @module dev-agent
 *
 * @example
 * ```typescript
 * import type { DevAgent, InvokeOptions } from './dev-agent.js';
 *
 * async function runAgent(agent: DevAgent): Promise<void> {
 *   const result = await agent.invoke('Fix the failing test in auth.ts', {
 *     timeoutMs: 60_000,
 *   });
 *
 *   console.log(`Output: ${result.output}`);
 *   console.log(`Invocation: ${result.invocationId}`);
 * }
 * ```
 *
 * @example
 * ```typescript
 * import type { DevAgent, StreamChunk } from './dev-agent.js';
 *
 * async function streamAgent(agent: DevAgent): Promise<void> {
 *   const stream = agent.invokeStream('Refactor the logger module');
 *
 *   for await (const chunk of stream) {
 *     process.stdout.write(chunk.text);
 *   }
 * }
 * ```
 */

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/**
 * Options for configuring an agent invocation.
 *
 * All fields are optional; omitting them will use the agent's defaults.
 */
export interface InvokeOptions {
  /**
   * Maximum time in milliseconds before the invocation is aborted.
   *
   * Overrides the agent's default timeout for this specific invocation.
   */
  timeoutMs?: number;

  /**
   * An external abort signal that can be used to cancel the invocation.
   *
   * When aborted, the invocation will throw a {@link import('./common.js').FacetError | FacetError}
   * with code `'CANCELLED'`.
   */
  signal?: AbortSignal;

  /**
   * Arbitrary metadata to attach to the invocation.
   *
   * Implementations may use this for logging, tracing, or passing
   * provider-specific options.
   */
  metadata?: Record<string, unknown>;
}

/**
 * The result of a completed agent invocation.
 */
export interface AgentResult {
  /** The text output produced by the agent. */
  output: string;

  /** Unique identifier for this invocation, used for tracking and cancellation. */
  invocationId: string;

  /**
   * Token usage statistics for the invocation.
   *
   * Not all agents provide usage data; fields are optional.
   */
  usage?: {
    /** Number of input/prompt tokens consumed. */
    inputTokens?: number;

    /** Number of output/completion tokens produced. */
    outputTokens?: number;
  };
}

/**
 * A chunk of streaming output from an agent invocation.
 */
export interface StreamChunk {
  /** The text content of this chunk. */
  text: string;

  /**
   * Arbitrary metadata associated with this chunk.
   *
   * Implementations may include tool-use markers, progress indicators,
   * or other provider-specific data.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Describes the capabilities supported by an agent implementation.
 *
 * Consumers can query capabilities to adapt their behavior based on
 * what the underlying agent supports.
 */
export interface AgentCapabilities {
  /** Whether the agent supports streaming responses via {@link DevAgent.invokeStream}. */
  streaming: boolean;

  /** Whether the agent supports cancellation of in-flight invocations. */
  cancellation: boolean;

  /**
   * List of model identifiers the agent can use.
   *
   * An empty array indicates the agent does not expose model selection.
   */
  models: string[];
}

// ---------------------------------------------------------------------------
// Facet interface
// ---------------------------------------------------------------------------

/**
 * Provider-agnostic interface for AI development agents.
 *
 * All methods are asynchronous and return Promises so that implementations
 * can interact with remote APIs, subprocesses, or other async backends
 * without blocking.
 *
 * Implementations should throw {@link import('./common.js').FacetError | FacetError}
 * with appropriate error codes:
 * - `'VALIDATION'` — invalid input (e.g. empty prompt)
 * - `'TIMEOUT'` — invocation exceeded the configured timeout
 * - `'CANCELLED'` — invocation was cancelled via {@link DevAgent.cancel} or abort signal
 */
export interface DevAgent {
  /**
   * Invoke the agent with a prompt and wait for the complete result.
   *
   * @param prompt - The instruction or prompt to send to the agent.
   * @param options - Optional invocation configuration.
   * @returns The complete result of the invocation.
   * @throws {FacetError} With code `'VALIDATION'` if the prompt is empty.
   * @throws {FacetError} With code `'TIMEOUT'` if the invocation exceeds the timeout.
   * @throws {FacetError} With code `'CANCELLED'` if the invocation is cancelled.
   */
  invoke(prompt: string, options?: InvokeOptions): Promise<AgentResult>;

  /**
   * Invoke the agent with a prompt and stream the response.
   *
   * Returns an async iterable that yields {@link StreamChunk} objects as
   * the agent produces output. The stream completes when the agent finishes.
   *
   * @param prompt - The instruction or prompt to send to the agent.
   * @param options - Optional invocation configuration.
   * @returns An async iterable of response chunks.
   * @throws {FacetError} With code `'VALIDATION'` if the prompt is empty.
   * @throws {FacetError} With code `'TIMEOUT'` if the invocation exceeds the timeout.
   * @throws {FacetError} With code `'CANCELLED'` if the invocation is cancelled.
   */
  invokeStream(
    prompt: string,
    options?: InvokeOptions,
  ): AsyncIterableIterator<StreamChunk>;

  /**
   * Cancel an in-flight invocation by its identifier.
   *
   * If the invocation has already completed or does not exist, this method
   * is a no-op.
   *
   * @param invocationId - The identifier of the invocation to cancel.
   */
  cancel(invocationId: string): Promise<void>;

  /**
   * Query the capabilities of this agent implementation.
   *
   * @returns A description of the agent's supported features.
   */
  getCapabilities(): Promise<AgentCapabilities>;
}
