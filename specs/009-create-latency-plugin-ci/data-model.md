# Data Model: latency-plugin-ci-cd

## Core Entities

### PipelineStatus (Union Type)

Status of a pipeline run lifecycle.

```typescript
type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
```

### TriggerOptions (Interface)

Configuration for triggering a pipeline execution.

```typescript
interface TriggerOptions {
  /** Branch or ref to run against. */
  branch?: string;
  /** Key-value parameters passed to the pipeline. */
  parameters?: Record<string, string>;
  /** Environment variables to set during execution. */
  environment?: Record<string, string>;
}
```

### Pipeline (Interface)

Metadata about a pipeline definition (not an execution).

```typescript
interface Pipeline {
  /** Unique identifier for the pipeline. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Optional description. */
  description?: string;
  /** Default branch the pipeline runs against. */
  defaultBranch?: string;
}
```

### PipelineRun (Interface)

A single execution instance of a pipeline.

```typescript
interface PipelineRun {
  /** Unique identifier for this run. */
  id: string;
  /** ID of the pipeline that was executed. */
  pipelineId: string;
  /** Current execution status. */
  status: PipelineStatus;
  /** Branch or ref this run executed against. */
  branch?: string;
  /** When the run was created/queued. */
  createdAt: Date;
  /** When the run started executing. */
  startedAt?: Date;
  /** When the run finished (success, failure, or cancellation). */
  completedAt?: Date;
  /** URL to view logs for this run. */
  logsUrl?: string;
}
```

### CICDPipeline (Facet Interface)

The facet interface for CI/CD pipeline operations.

```typescript
interface CICDPipeline {
  triggerPipeline(pipelineId: string, options?: TriggerOptions): Promise<PipelineRun>;
  getPipelineStatus(runId: string): Promise<PipelineRun>;
  cancelPipeline(runId: string): Promise<void>;
  listPipelines(): Promise<Pipeline[]>;
}
```

## Plugin Entities

### AbstractCICDPlugin (Abstract Class)

Implements `CICDPipeline` with validation and delegation to abstract methods.

```typescript
abstract class AbstractCICDPlugin implements CICDPipeline {
  // Public: validates input, delegates to do* methods
  triggerPipeline(pipelineId: string, options?: TriggerOptions): Promise<PipelineRun>;
  getPipelineStatus(runId: string): Promise<PipelineRun>;
  cancelPipeline(runId: string): Promise<void>;
  listPipelines(): Promise<Pipeline[]>;

  // Abstract: subclasses implement provider-specific logic
  protected abstract doTrigger(pipelineId: string, options?: TriggerOptions): Promise<PipelineRun>;
  protected abstract doGetStatus(runId: string): Promise<PipelineRun>;
  protected abstract doCancel(runId: string): Promise<void>;
  protected abstract doListPipelines(): Promise<Pipeline[]>;
}
```

## Utility Types

### PollOptions (Interface)

Configuration for status polling.

```typescript
interface PollOptions {
  /** Base interval between polls in milliseconds. */
  intervalMs: number;
  /** Maximum total time before timeout in milliseconds. */
  timeoutMs: number;
  /** Multiplier for exponential backoff (default: 1 = no backoff). */
  backoffMultiplier?: number;
  /** Maximum interval cap in milliseconds. */
  maxIntervalMs?: number;
  /** AbortSignal to cancel polling. */
  signal?: AbortSignal;
}
```

### LogLine (Interface)

A single line of pipeline log output.

```typescript
interface LogLine {
  /** When this log line was produced. */
  timestamp: Date;
  /** The log message content. */
  message: string;
  /** Log severity level. */
  level?: 'info' | 'warn' | 'error' | 'debug';
  /** Output stream origin. */
  stream?: 'stdout' | 'stderr';
}
```

### LogStream (Abstract Class)

Async iterable for streaming pipeline logs.

```typescript
abstract class LogStream implements AsyncIterable<LogLine> {
  abstract [Symbol.asyncIterator](): AsyncIterator<LogLine>;
  abstract close(): Promise<void>;
}
```

## Relationships

```
@generacy-ai/latency (core)
  └── facets/pipeline.ts
      ├── PipelineStatus (type)
      ├── TriggerOptions (interface)
      ├── Pipeline (interface)
      ├── PipelineRun (interface)
      └── CICDPipeline (interface)

@generacy-ai/latency-plugin-ci-cd (plugin)
  ├── AbstractCICDPlugin (implements CICDPipeline)
  ├── pollUntilComplete (utility function)
  ├── PollOptions (interface)
  ├── LogLine (interface)
  └── LogStream (abstract class)
```

## Validation Rules

| Field | Rule | Error Code |
|-------|------|------------|
| `pipelineId` in `triggerPipeline` | Must be non-empty string (after trim) | `VALIDATION_ERROR` |
| `runId` in `getPipelineStatus` | Must be non-empty string (after trim) | `VALIDATION_ERROR` |
| `runId` in `cancelPipeline` | Must be non-empty string (after trim) | `VALIDATION_ERROR` |
| `PollOptions.intervalMs` | Must be > 0 | `VALIDATION_ERROR` |
| `PollOptions.timeoutMs` | Must be > 0 | `VALIDATION_ERROR` |
