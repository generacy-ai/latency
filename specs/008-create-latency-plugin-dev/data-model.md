# Data Model: latency-plugin-dev-agent

## Core Entities

### DevAgent (Interface — in `@generacy-ai/latency`)

The facet interface that all dev agent plugins implement.

```typescript
interface DevAgent {
  invoke(prompt: string, options?: InvokeOptions): Promise<AgentResult>;
  invokeStream(prompt: string, options?: InvokeOptions): AsyncIterableIterator<StreamChunk>;
  cancel(invocationId: string): Promise<void>;
  getCapabilities(): Promise<AgentCapabilities>;
}
```

### InvokeOptions

Options passed to `invoke` and `invokeStream`.

```typescript
interface InvokeOptions {
  /** Timeout in milliseconds. Overrides default. */
  timeoutMs?: number;
  /** External abort signal for manual cancellation. */
  signal?: AbortSignal;
  /** Opaque metadata forwarded to the agent implementation. */
  metadata?: Record<string, unknown>;
}
```

### AgentResult

The result of a completed invocation.

```typescript
interface AgentResult {
  /** The agent's response text. */
  output: string;
  /** Unique identifier for this invocation. */
  invocationId: string;
  /** Token/resource usage statistics (agent-specific). */
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
  /** Arbitrary metadata from the agent implementation. */
  metadata?: Record<string, unknown>;
}
```

### StreamChunk

A single chunk emitted during streaming invocation.

```typescript
interface StreamChunk {
  /** Incremental text content. */
  text: string;
  /** Whether this is the final chunk. */
  done: boolean;
  /** Partial usage stats (updated cumulatively). */
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}
```

### AgentCapabilities

Describes what a specific agent implementation supports.

```typescript
interface AgentCapabilities {
  /** Whether the agent supports streaming responses. */
  supportsStreaming: boolean;
  /** Whether in-flight invocations can be cancelled. */
  supportsCancellation: boolean;
  /** List of model identifiers the agent can use. */
  models?: string[];
  /** Maximum prompt length in characters (if known). */
  maxPromptLength?: number;
}
```

### InternalInvokeOptions (Plugin-internal)

Extended options passed to abstract `doInvoke`/`doInvokeStream` methods. Not exported from the core package.

```typescript
interface InternalInvokeOptions extends InvokeOptions {
  /** Assigned invocation ID for tracking. */
  invocationId: string;
  /** Merged signal (combines user signal + timeout). */
  signal: AbortSignal;
}
```

### AbstractDevAgentOptions (Plugin-internal)

Constructor options for the abstract class.

```typescript
interface AbstractDevAgentOptions {
  /** Default timeout in ms for all invocations. Defaults to 30000. */
  defaultTimeoutMs?: number;
}
```

## Type Relationships

```
InvokeOptions ──extends──▸ InternalInvokeOptions
                                    │
DevAgent ◁───implements─── AbstractDevAgentPlugin
   │                               │
   ├── invoke() ──────────▸ doInvoke()          [abstract]
   ├── invokeStream() ────▸ doInvokeStream()    [abstract]
   ├── cancel()
   └── getCapabilities() ─▸ doGetCapabilities() [abstract]

FacetError (from @generacy-ai/latency)
   └── used with codes: 'VALIDATION', 'TIMEOUT', 'CANCELLED', 'AGENT_ERROR'
```

## Error Codes

| Code | Usage | Thrown By |
|------|-------|-----------|
| `VALIDATION` | Empty/invalid prompt | `invoke`, `invokeStream` |
| `TIMEOUT` | Invocation exceeded timeout | `invoke`, `invokeStream` |
| `CANCELLED` | Invocation manually cancelled | `invoke`, `invokeStream` |
| `AGENT_ERROR` | Agent-specific failure | Subclass `doInvoke` implementations |
