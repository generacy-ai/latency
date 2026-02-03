# Data Model: Claude Code Plugin

## Core Entities

### ClaudeCodeConfig

Plugin constructor configuration.

```typescript
export interface ClaudeCodeConfig {
  /** Path to the claude CLI binary. Defaults to 'claude'. */
  cliPath?: string;

  /** Working directory for CLI invocations. Required. */
  workingDirectory: string;

  /** Default model to use (e.g., 'sonnet', 'opus', or full model ID). */
  model?: string;

  /** Maximum number of agentic turns per invocation. */
  maxTurns?: number;

  /** Default timeout in milliseconds. Passed to AbstractDevAgentPlugin. */
  defaultTimeoutMs?: number;
}
```

### ClaudeCodeResult

Extends `AgentResult` with Claude Code-specific metadata.

```typescript
import { AgentResult } from '@generacy-ai/latency';

export interface ClaudeCodeResult extends AgentResult {
  /** Model used for the invocation (e.g., 'claude-sonnet-4-5-20250929') */
  model: string;

  /** Token usage (required, not optional — overrides AgentResult.usage) */
  usage: {
    inputTokens: number;
    outputTokens: number;
  };

  /** Files modified during invocation (extracted from tool calls) */
  modifiedFiles: string[];

  /** Tools called during invocation */
  toolCalls: ClaudeCodeToolCall[];

  /** Session ID for continuation */
  sessionId?: string;

  /** Total cost in USD for this invocation */
  costUsd?: number;

  /** Duration of API calls in milliseconds */
  durationApiMs?: number;

  /** Number of agentic turns taken */
  numTurns?: number;
}
```

### ClaudeCodeToolCall

Represents a single tool invocation within a Claude Code session.

```typescript
export interface ClaudeCodeToolCall {
  /** Tool name (e.g., 'Read', 'Edit', 'Bash') */
  name: string;

  /** Tool input parameters */
  input: unknown;

  /** Tool output/result */
  output: unknown;

  /** Duration of the tool call in milliseconds */
  duration: number;
}
```

### ClaudeCodeCapabilities

Extends `AgentCapabilities` with Claude Code-specific info.

```typescript
import { AgentCapabilities } from '@generacy-ai/latency';

export interface ClaudeCodeCapabilities extends AgentCapabilities {
  /** CLI version string (e.g., '1.0.33') */
  version: string;

  /** Available model aliases */
  availableModels: string[];

  /** Whether MCP is supported (always true for current Claude Code) */
  supportsMCP: boolean;

  /** Whether Docker invocation is supported (out of scope — false) */
  supportsDocker: boolean;
}
```

### ClaudeCodeErrorCode

Error codes for Claude Code-specific failures.

```typescript
export enum ClaudeCodeErrorCode {
  /** claude binary not found at configured path */
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',

  /** Authentication or API key failure */
  AUTH_FAILURE = 'AUTH_FAILURE',

  /** Rate limited by the API */
  RATE_LIMITED = 'RATE_LIMITED',

  /** Failed to parse CLI JSON output */
  PARSE_ERROR = 'PARSE_ERROR',
}
```

## Type Guards

```typescript
import { AgentResult } from '@generacy-ai/latency';

/**
 * Type guard to check if an AgentResult is a ClaudeCodeResult.
 * Checks for the presence of Claude Code-specific fields.
 */
export function isClaudeCodeResult(result: AgentResult): result is ClaudeCodeResult {
  return (
    'model' in result &&
    typeof (result as ClaudeCodeResult).model === 'string' &&
    'modifiedFiles' in result &&
    Array.isArray((result as ClaudeCodeResult).modifiedFiles) &&
    'toolCalls' in result &&
    Array.isArray((result as ClaudeCodeResult).toolCalls)
  );
}
```

## Relationships

```
ClaudeCodeConfig ──creates──► ClaudeCodePlugin
                                │
                                ├── doInvoke() ──► ClaudeCodeResult (extends AgentResult)
                                │                    ├── ClaudeCodeToolCall[]
                                │                    └── usage, model, sessionId, etc.
                                │
                                ├── doInvokeStream() ──► StreamChunk (from core)
                                │
                                └── doGetCapabilities() ──► ClaudeCodeCapabilities (extends AgentCapabilities)

ClaudeCodeErrorCode ──used-by──► FacetError.code field

isClaudeCodeResult ──narrows──► AgentResult → ClaudeCodeResult
```

## CLI JSON Output → ClaudeCodeResult Mapping

| CLI JSON Field | ClaudeCodeResult Field | Notes |
|----------------|----------------------|-------|
| `result` | `output` | Text content (maps to `AgentResult.output`) |
| `session_id` | `invocationId` + `sessionId` | Used for both base and extension |
| `usage.input_tokens` | `usage.inputTokens` | Rename from snake_case |
| `usage.output_tokens` | `usage.outputTokens` | Rename from snake_case |
| `total_cost_usd` | `costUsd` | Optional extension field |
| `duration_api_ms` | `durationApiMs` | Optional extension field |
| `num_turns` | `numTurns` | Optional extension field |
| `modelUsage` keys | `model` | First/primary model key |
| (parsed from tool_use blocks) | `modifiedFiles` | Extract file paths from Edit/Write tool calls |
| (parsed from tool_use blocks) | `toolCalls` | Map assistant message tool_use blocks |
