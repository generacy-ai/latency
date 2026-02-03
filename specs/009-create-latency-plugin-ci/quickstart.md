# Quickstart: @generacy-ai/latency-plugin-ci-cd

## Installation

```bash
pnpm add @generacy-ai/latency-plugin-ci-cd @generacy-ai/latency
```

## Usage

### Extending the Abstract Plugin

Create a concrete implementation by extending `AbstractCICDPlugin`:

```typescript
import { AbstractCICDPlugin } from '@generacy-ai/latency-plugin-ci-cd';
import type { Pipeline, PipelineRun, TriggerOptions } from '@generacy-ai/latency';

class GitHubActionsCICDPlugin extends AbstractCICDPlugin {
  protected async doTrigger(pipelineId: string, options?: TriggerOptions): Promise<PipelineRun> {
    // Call GitHub Actions API to trigger a workflow
  }

  protected async doGetStatus(runId: string): Promise<PipelineRun> {
    // Fetch workflow run status from GitHub API
  }

  protected async doCancel(runId: string): Promise<void> {
    // Cancel a workflow run via GitHub API
  }

  protected async doListPipelines(): Promise<Pipeline[]> {
    // List repository workflows from GitHub API
  }
}
```

### Using the Polling Utility

```typescript
import { pollUntilComplete } from '@generacy-ai/latency-plugin-ci-cd';
import type { PipelineRun } from '@generacy-ai/latency';

const plugin = new GitHubActionsCICDPlugin();
const run = await plugin.triggerPipeline('build-and-test', { branch: 'main' });

// Poll until the run completes
const completed = await pollUntilComplete(
  () => plugin.getPipelineStatus(run.id),
  (result: PipelineRun) => ['completed', 'failed', 'cancelled'].includes(result.status),
  { intervalMs: 5000, timeoutMs: 600_000 },
);
```

### Using Log Streaming

```typescript
import type { LogStream } from '@generacy-ai/latency-plugin-ci-cd';

// Concrete implementations provide a log stream for a run
const logStream: LogStream = await plugin.getLogStream(run.id);

for await (const line of logStream) {
  console.log(`[${line.timestamp.toISOString()}] ${line.message}`);
}

await logStream.close();
```

## Available Commands

```bash
# Build the package
pnpm build

# Run type checking
pnpm typecheck

# Run tests
pnpm test
```

## Troubleshooting

### "Cannot find module '@generacy-ai/latency'"

Ensure the core package is installed as a peer dependency:
```bash
pnpm add @generacy-ai/latency
```

### Type errors with abstract methods

All four abstract methods must be implemented in subclasses:
- `doTrigger`
- `doGetStatus`
- `doCancel`
- `doListPipelines`
