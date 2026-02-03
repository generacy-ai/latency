# Implementation Plan: Create latency-plugin-claude-code + interface

**Feature**: Claude Code plugin and interface packages for the Latency ecosystem
**Branch**: `013-create-latency-plugin-claude`
**Status**: Complete

## Summary

Create two packages:
1. **`@generacy-ai/latency-plugin-claude-code`** — Concrete implementation of `AbstractDevAgentPlugin` that invokes the Claude Code CLI via `execa`, supporting both batch (`--output-format json`) and streaming (`--output-format stream-json`) modes.
2. **`@generacy-ai/claude-code-interface`** — Types-only package defining `ClaudeCodeResult`, `ClaudeCodeCapabilities`, `ClaudeCodeToolCall`, `ClaudeCodeErrorCode`, `ClaudeCodeConfig`, and the `isClaudeCodeResult` type guard.

## Technical Context

| Aspect | Value |
|--------|-------|
| Language | TypeScript 5.4+ (strict mode) |
| Module system | ESM (`"type": "module"`, NodeNext resolution) |
| Build tool | `tsc` (no bundler) |
| Test framework | vitest 3.x |
| Runtime | Node.js >= 20 |
| Monorepo | pnpm workspaces (`packages/*`) |
| Base class | `AbstractDevAgentPlugin` from `@generacy-ai/latency-plugin-dev-agent` |
| Core types | `AgentResult`, `StreamChunk`, `AgentCapabilities`, `FacetError` from `@generacy-ai/latency` |
| CLI invocation | `execa` (ESM-compatible process runner) |

## Project Structure

```
packages/
  claude-code-interface/
    package.json
    tsconfig.json
    src/
      index.ts                    # Re-exports all types
      types.ts                    # ClaudeCodeResult, ClaudeCodeToolCall, ClaudeCodeCapabilities, ClaudeCodeConfig
      error-codes.ts              # ClaudeCodeErrorCode enum
      type-guards.ts              # isClaudeCodeResult
    __tests__/
      type-guards.test.ts

  latency-plugin-claude-code/
    package.json
    tsconfig.json
    src/
      index.ts                    # Re-exports plugin + re-exports interface types
      claude-code-plugin.ts       # ClaudeCodePlugin class
      cli-args.ts                 # buildArgs helper
      result-parser.ts            # parseResult / parseStreamEvent helpers
    __tests__/
      claude-code-plugin.test.ts  # Tests with mocked execa
      cli-args.test.ts
      result-parser.test.ts
```

## Architecture

### Abstract Contract

`AbstractDevAgentPlugin` requires three abstract methods:

```typescript
protected abstract doInvoke(prompt: string, options: InternalInvokeOptions): Promise<AgentResult>;
protected abstract doInvokeStream(prompt: string, options: InternalInvokeOptions): AsyncIterableIterator<StreamChunk>;
protected abstract doGetCapabilities(): Promise<AgentCapabilities>;
```

The base class provides `invoke()`, `invokeStream()`, `cancel()`, and `getCapabilities()` — handling timeout/cancellation signal merging, invocation tracking, and error normalization (via `FacetError`).

### Plugin Implementation Strategy

**`doInvoke`**: Run `claude -p <prompt> --output-format json [flags]` via `execa`. Parse the JSON result object into `ClaudeCodeResult`. Map CLI errors to `ClaudeCodeErrorCode` values wrapped in `FacetError`.

**`doInvokeStream`**: Run `claude -p <prompt> --output-format stream-json [flags]` via `execa` with streaming stdout. Parse each newline-delimited JSON event. Yield `StreamChunk` objects for assistant text content. The stream-json format emits events with types like `assistant`, `result`, and `system`.

**`doGetCapabilities`**: Run `claude --version` to get version string. Return a `ClaudeCodeCapabilities` object with `streaming: true`, `cancellation: true`, version, and static flags for `supportsMCP`/`supportsDocker`.

### CLI Flag Mapping

| Plugin Config | CLI Flag |
|---------------|----------|
| `model` | `--model <model>` |
| `maxTokens` | `--max-turns <n>` |
| `options.signal` | Passed to execa for process termination |
| `options.metadata.systemPrompt` | `--append-system-prompt <text>` |
| `options.metadata.allowedTools` | `--allowedTools <tools>` |
| `options.metadata.maxBudgetUsd` | `--max-budget-usd <amount>` |
| `options.metadata.sessionId` | `--session-id <uuid>` |
| `options.metadata.continueSession` | `--continue` |
| `options.metadata.resumeSession` | `--resume <id>` |

### Error Mapping

| CLI Condition | Error Code | Detection |
|---------------|------------|-----------|
| `claude` command not found | `CLI_NOT_FOUND` | execa ENOENT error |
| Auth/API key failure | `AUTH_FAILURE` | Exit code + stderr pattern matching |
| Rate limiting | `RATE_LIMITED` | Exit code + stderr "rate limit" pattern |
| Invalid JSON output | `PARSE_ERROR` | JSON.parse failure on stdout |

### Data Flow

```
User code
  → plugin.invoke(prompt, options)
    → AbstractDevAgentPlugin.invoke() [signal merging, tracking]
      → ClaudeCodePlugin.doInvoke(prompt, internalOptions)
        → buildArgs(prompt, config, internalOptions)  → string[]
        → execa('claude', args, { cwd, signal })
        → parseResult(stdout)  → ClaudeCodeResult
      ← ClaudeCodeResult (extends AgentResult)
    ← AgentResult
  ← AgentResult
```

## Dependencies

### claude-code-interface
```json
{
  "dependencies": {
    "@generacy-ai/latency": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.14.0",
    "vitest": "^3.0.0"
  }
}
```

### latency-plugin-claude-code
```json
{
  "dependencies": {
    "@generacy-ai/latency-plugin-dev-agent": "workspace:*",
    "@generacy-ai/claude-code-interface": "workspace:*",
    "execa": "^9.0.0"
  },
  "devDependencies": {
    "@generacy-ai/latency": "workspace:*",
    "typescript": "^5.4.5",
    "@types/node": "^20.14.0",
    "vitest": "^3.0.0"
  }
}
```

## Key Decisions

1. **`execa` v9+** — ESM-native, good TypeScript types, supports streaming and AbortSignal
2. **Separate interface package** — Follows codebase convention; consumers can depend on types without pulling in execa
3. **`FacetError` for all errors** — Consistent with base class error normalization; plugin-specific codes go in the `code` field
4. **`--output-format json` not `--print` alone** — JSON mode gives structured metadata (usage, session_id, cost)
5. **`--output-format stream-json` for streaming** — Emits newline-delimited JSON events that can be parsed incrementally
6. **Re-export interface types from plugin package** — Consumers of the plugin don't need to separately install the interface package
7. **`@generacy-ai/latency` as `dependencies`** in interface package — Follows the pattern used by most packages in the repo (not peerDependencies)
