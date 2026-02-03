# Quickstart: latency-plugin-dev-agent

## Installation

```bash
pnpm add @generacy-ai/latency-plugin-dev-agent
```

The core types package `@generacy-ai/latency` is a transitive dependency and will be installed automatically.

## Usage

### Creating a Concrete Agent

Extend `AbstractDevAgentPlugin` and implement the three abstract methods:

```typescript
import { AbstractDevAgentPlugin, InternalInvokeOptions } from '@generacy-ai/latency-plugin-dev-agent';
import type { AgentResult, AgentCapabilities, StreamChunk } from '@generacy-ai/latency';

class MyAgent extends AbstractDevAgentPlugin {
  constructor() {
    super({ defaultTimeoutMs: 60_000 }); // 60s default timeout
  }

  protected async doInvoke(prompt: string, options: InternalInvokeOptions): Promise<AgentResult> {
    // Call your AI API here, passing options.signal for cancellation support
    const response = await callMyAPI(prompt, { signal: options.signal });
    return {
      output: response.text,
      invocationId: options.invocationId,
      usage: { inputTokens: response.inputTokens, outputTokens: response.outputTokens },
    };
  }

  protected async *doInvokeStream(
    prompt: string,
    options: InternalInvokeOptions,
  ): AsyncIterableIterator<StreamChunk> {
    const stream = callMyStreamingAPI(prompt, { signal: options.signal });
    for await (const chunk of stream) {
      yield { text: chunk.text, done: false };
    }
    yield { text: '', done: true };
  }

  protected async doGetCapabilities(): Promise<AgentCapabilities> {
    return {
      supportsStreaming: true,
      supportsCancellation: true,
      models: ['my-model-v1'],
    };
  }
}
```

### Invoking an Agent

```typescript
const agent = new MyAgent();

// Simple invocation
const result = await agent.invoke('Write a hello world function');
console.log(result.output);

// With timeout override
const result2 = await agent.invoke('Complex task', { timeoutMs: 120_000 });

// Streaming
for await (const chunk of agent.invokeStream('Explain TypeScript generics')) {
  process.stdout.write(chunk.text);
  if (chunk.done) break;
}
```

### Cancellation

```typescript
const agent = new MyAgent();

// Start a long invocation
const promise = agent.invoke('Long running task');

// Cancel it after 5 seconds (invocationId is returned in the result,
// but for cancellation you'd typically use an AbortSignal instead)
const controller = new AbortController();
const promise2 = agent.invoke('Another task', { signal: controller.signal });

// Cancel from outside
controller.abort();
```

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Troubleshooting

### FacetError with code 'VALIDATION'
Ensure the prompt is a non-empty string. Whitespace-only prompts are rejected.

### FacetError with code 'TIMEOUT'
The invocation exceeded the timeout. Increase `defaultTimeoutMs` in the constructor or pass `timeoutMs` in `InvokeOptions`.

### FacetError with code 'CANCELLED'
The invocation was cancelled via `AbortSignal` or `cancel()`. This is expected behavior when cancellation is triggered intentionally.
