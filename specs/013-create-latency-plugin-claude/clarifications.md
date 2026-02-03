# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 21:16

### Q1: CLI Output Format
**Context**: The plugin must parse Claude Code CLI output into a structured ClaudeCodeResult (model, usage, modifiedFiles, toolCalls, sessionId). The parsing strategy depends on the CLI's output format.
**Question**: Should the plugin use Claude Code's `--output-format json` flag and parse its structured JSON output, or use `--print` mode with text parsing? JSON mode provides structured data but may differ between CLI versions.
**Options**:
- A: Use `--output-format json` (structured, reliable, version-dependent)
- B: Use `--print` with text parsing (simpler, but loses structured metadata)
- C: Support both modes with a config option

**Answer**: **A: Use `--output-format json`** — The plugin needs structured `ClaudeCodeResult` with `model`, `usage`, `modifiedFiles`, `toolCalls`, and `sessionId`. JSON output mode provides all of this. Text parsing would be fragile and lose metadata. Option C (both modes) adds unnecessary complexity.

### Q2: Streaming Implementation
**Context**: AbstractDevAgentPlugin requires implementing `doInvokeStream` for streaming responses. Claude Code CLI supports streaming via `--stream` flag, but the spec only shows `doInvoke`.
**Question**: Should the initial implementation include streaming support via `doInvokeStream`, or should it throw a 'not supported' error and defer streaming to a later iteration?
**Options**:
- A: Implement streaming using Claude Code CLI's streaming output
- B: Defer streaming - throw FacetError('UNSUPPORTED') for now

**Answer**: **A: Implement streaming** — `AbstractDevAgentPlugin` declares `doInvokeStream` as an abstract method. Claude Code CLI natively supports streaming. Implementing it properly fulfills the abstract contract.

### Q3: Docker & MCP Scope
**Context**: The spec lists `invokeInDocker` and `invokeWithMCP` methods, but neither `DockerConfig` nor `MCPServerConfig` types are defined. These are complex features that could significantly expand scope.
**Question**: Should Docker and MCP invocation methods be fully implemented in this issue, or defined as stubs/interfaces only with implementation deferred to separate issues?
**Options**:
- A: Implement both fully (Docker via `docker run`, MCP via CLI `--mcp-config`)
- B: Define interfaces and stub methods that throw 'not yet implemented'
- C: Remove from this issue entirely - create separate issues for each

**Answer**: **C: Remove entirely, create separate issues** — Neither `DockerConfig` nor `MCPServerConfig` types exist yet, and implementing them would roughly double the scope. Removing them keeps the public API clean — no methods that throw "not yet implemented". Create follow-up issues for Docker and MCP support separately.

### Q4: Package Naming Convention
**Context**: Existing packages use inconsistent naming: `latency-plugin-dev-agent`, `latency-plugin-source-control`, `latency-plugin-issue-tracker`, but also `plugin-ci-cd`. The spec proposes `latency-plugin-claude-code` and `claude-code-interface`.
**Question**: Should the interface package be named `claude-code-interface` (as in spec) or follow a pattern like `latency-plugin-claude-code-interface` to be consistent with the plugin package naming?
**Options**:
- A: `claude-code-interface` (as specified)
- B: `latency-claude-code-interface` (adds latency prefix)
- C: `latency-plugin-claude-code-types` (follows types-only convention)

**Answer**: **A: `claude-code-interface` (as specified)** — The architecture doc consistently uses the `*-interface` pattern without a `latency-` prefix (e.g., `github-issues-interface`, `git-interface`). The `@generacy-ai/` scope provides namespacing.

### Q5: Error Handling Strategy
**Context**: CLI invocation can fail in many ways: CLI not found, authentication failure, rate limiting, malformed output, timeout. The abstract base class converts errors to FacetError with codes like VALIDATION, TIMEOUT, CANCELLED, UNKNOWN.
**Question**: Should the plugin define Claude Code-specific error codes (e.g., CLI_NOT_FOUND, AUTH_FAILURE, RATE_LIMITED) beyond the base class codes, or map all errors to the existing FacetError code set?
**Options**:
- A: Define Claude Code-specific error codes in the interface package
- B: Map to existing FacetError codes only (VALIDATION, TIMEOUT, CANCELLED, UNKNOWN)

**Answer**: **A: Define Claude Code-specific error codes** — CLI invocation has distinct failure modes consumers need to differentiate: `CLI_NOT_FOUND`, `AUTH_FAILURE`, `RATE_LIMITED`, `PARSE_ERROR`. Mapping all to `UNKNOWN` loses critical diagnostic information. The interface package is the right place for these codes.

