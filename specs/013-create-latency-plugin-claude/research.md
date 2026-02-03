# Research: Claude Code CLI Integration

## Claude Code CLI Output Formats

### `--output-format json` (Batch Mode)

The Claude Code CLI with `-p --output-format json` returns a single JSON object on stdout after completion. Based on the Claude Agent SDK's `SDKResultMessage` type, the result includes:

```typescript
// Success result
{
  type: 'result',
  subtype: 'success',
  session_id: string,
  duration_ms: number,
  duration_api_ms: number,
  is_error: boolean,
  num_turns: number,
  result: string,           // The assistant's final text output
  total_cost_usd: number,
  usage: {
    input_tokens: number,
    output_tokens: number,
    cache_creation_input_tokens: number,
    cache_read_input_tokens: number,
  },
  modelUsage: {
    [modelName: string]: {
      inputTokens: number,
      outputTokens: number,
      cacheReadInputTokens: number,
      cacheCreationInputTokens: number,
      costUSD: number,
      contextWindow: number,
    }
  }
}

// Error result
{
  type: 'result',
  subtype: 'error_max_turns' | 'error_during_execution' | 'error_max_budget_usd',
  session_id: string,
  is_error: boolean,
  errors: string[],
  // ... same usage/cost fields
}
```

### `--output-format stream-json` (Streaming Mode)

Emits newline-delimited JSON events. Key event types:

- **`system` (init)**: Session initialization with model, tools, session_id
- **`assistant`**: Assistant response messages containing text content blocks and tool use
- **`user`**: Tool results fed back (internal loop)
- **`result`**: Final result (same structure as batch mode)
- **`stream_event`** (with `--include-partial-messages`): Partial text deltas

For streaming text extraction, the pattern is:
```bash
claude -p "prompt" --output-format stream-json | jq -j '.event.delta.text? // empty'
```

## Technology Decisions

### execa v9

**Choice**: `execa` v9.x (ESM-native)
**Rationale**:
- Pure ESM package matching our module system
- First-class TypeScript types
- Built-in `AbortSignal` support for process cancellation
- Streaming stdout/stderr via Node.js streams
- Better error handling than `child_process.spawn`

**Alternatives considered**:
- `child_process.execFile` — Lower-level, no streaming helpers, manual signal handling
- `zx` — Too opinionated (shell mode), heavier dependency
- `@anthropic-ai/claude-agent-sdk` — The official SDK; however, the spec explicitly calls for CLI invocation via execa. The SDK could be considered for future enhancement but adds a heavier dependency and different abstraction level.

### Error Detection Strategy

Claude Code CLI error detection relies on a combination of:

1. **Process exit codes**: Non-zero exit indicates failure
2. **execa error types**: `ENOENT` for missing binary
3. **stderr content**: Pattern matching for auth failures, rate limits
4. **stdout parse failures**: Invalid JSON indicates parse errors

We wrap all errors in `FacetError` with appropriate `ClaudeCodeErrorCode` values.

### Streaming Implementation

**Approach**: Use `execa` with `{ stdout: 'pipe' }` and read stdout as a Node.js readable stream. Parse newline-delimited JSON events, extract text content from `assistant` messages, and yield `StreamChunk` objects.

**Key consideration**: The `signal` from `InternalInvokeOptions` must be passed to `execa` so the CLI process is terminated on cancellation/timeout. The base class handles signal merging.

## Implementation Patterns

### Following Existing Plugin Patterns

Based on analysis of `latency-plugin-source-control`, `latency-plugin-issue-tracker`, and `plugin-ci-cd`:

1. **Constructor takes a config object** — `ClaudeCodeConfig` with `cliPath`, `workingDirectory`, `model`, `maxTokens`
2. **Pass config to `super()`** for base class options (e.g., `defaultTimeoutMs`)
3. **Validate inputs** in the do* methods where needed
4. **Use `FacetError`** from core for errors (consistent with base class normalization)
5. **Re-export core types** from index.ts for consumer convenience
6. **`@generacy-ai/latency` as `dependencies`** (not peerDependencies) — matches most packages

### Test Strategy

Following the test patterns from `abstract-dev-agent-plugin.test.ts`:

1. **Mock `execa`** at the module level using vitest's `vi.mock`
2. **Test doInvoke**: Verify correct CLI args, verify result parsing, test each error code path
3. **Test doInvokeStream**: Mock streaming stdout, verify StreamChunk yielding, test cancellation mid-stream
4. **Test doGetCapabilities**: Mock `--version` output
5. **Test buildArgs**: Unit test the arg builder for each config combination
6. **Test parseResult**: Unit test with various JSON outputs, malformed JSON, error results

## Sources

- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Claude Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [execa v9 documentation](https://github.com/sindresorhus/execa)
