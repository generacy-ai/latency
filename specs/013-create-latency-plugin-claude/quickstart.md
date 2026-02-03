# Quickstart: latency-plugin-claude-code

## Installation

```bash
# Install the plugin package (includes interface types)
pnpm add @generacy-ai/latency-plugin-claude-code

# Or install the interface package only (types, no runtime)
pnpm add @generacy-ai/claude-code-interface
```

## Prerequisites

- Claude Code CLI installed and available in PATH (`claude --version`)
- Valid API key configured for Claude Code

## Basic Usage

### Invoke Claude Code

```typescript
import { ClaudeCodePlugin } from '@generacy-ai/latency-plugin-claude-code';

const plugin = new ClaudeCodePlugin({
  workingDirectory: '/path/to/project',
  model: 'sonnet',
});

// Simple invocation
const result = await plugin.invoke('Explain the main entry point');
console.log(result.output);  // Assistant's text response

// With type narrowing
import { isClaudeCodeResult } from '@generacy-ai/claude-code-interface';

if (isClaudeCodeResult(result)) {
  console.log(`Model: ${result.model}`);
  console.log(`Tokens: ${result.usage.inputTokens} in, ${result.usage.outputTokens} out`);
  console.log(`Modified files: ${result.modifiedFiles.join(', ')}`);
  console.log(`Session: ${result.sessionId}`);
}
```

### Streaming

```typescript
const stream = plugin.invokeStream('Refactor the auth module');

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### Cancellation

```typescript
const result = plugin.invoke('Long running task');

// Cancel by invocation ID
const invocationId = '...'; // obtained from result or tracking
await plugin.cancel(invocationId);

// Or use an AbortSignal
const controller = new AbortController();
const result = plugin.invoke('Task', { signal: controller.signal });
controller.abort();
```

### Capabilities

```typescript
const caps = await plugin.getCapabilities();
console.log(`Version: ${caps.version}`);
console.log(`Models: ${caps.availableModels.join(', ')}`);
console.log(`Streaming: ${caps.streaming}`);
```

### Error Handling

```typescript
import { FacetError } from '@generacy-ai/latency';
import { ClaudeCodeErrorCode } from '@generacy-ai/claude-code-interface';

try {
  await plugin.invoke('Do something');
} catch (err) {
  if (err instanceof FacetError) {
    switch (err.code) {
      case ClaudeCodeErrorCode.CLI_NOT_FOUND:
        console.error('Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code');
        break;
      case ClaudeCodeErrorCode.AUTH_FAILURE:
        console.error('Authentication failed. Check your API key.');
        break;
      case ClaudeCodeErrorCode.RATE_LIMITED:
        console.error('Rate limited. Try again later.');
        break;
      case ClaudeCodeErrorCode.PARSE_ERROR:
        console.error('Failed to parse CLI output.');
        break;
      case 'TIMEOUT':
        console.error('Invocation timed out.');
        break;
      case 'CANCELLED':
        console.error('Invocation was cancelled.');
        break;
    }
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `workingDirectory` | `string` | (required) | Working directory for CLI invocations |
| `cliPath` | `string` | `'claude'` | Path to the claude binary |
| `model` | `string` | CLI default | Model alias or full ID |
| `maxTurns` | `number` | unlimited | Max agentic turns per invocation |
| `defaultTimeoutMs` | `number` | `30000` | Default invocation timeout |

## Building from Source

```bash
cd packages/latency-plugin-claude-code
pnpm install
pnpm build
pnpm test
```
