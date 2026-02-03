# Feature Specification: Create latency-plugin-claude-code + interface

**Branch**: `013-create-latency-plugin-claude` | **Date**: 2026-02-03 | **Status**: Draft

## Summary

Create two packages for Claude Code integration: `latency-plugin-claude-code` (implementation extending `AbstractDevAgentPlugin` with CLI invocation via `--output-format json` and streaming support) and `claude-code-interface` (types, error codes, and type guards for consumers). Docker and MCP invocation are out of scope for this issue.

## Parent Epic
Part of #1 (Phase 1 - Repository & Package Setup) - Phase 1C

## Description

Create the Claude Code implementation with two packages:
1. **latency-plugin-claude-code** - The implementation
2. **claude-code-interface** - Types for consumers

## Plugin Package

```typescript
// @generacy-ai/latency-plugin-claude-code

import { AbstractDevAgentPlugin, InternalInvokeOptions } from '@generacy-ai/latency-plugin-dev-agent';
import { ClaudeCodeResult, ClaudeCodeCapabilities } from '@generacy-ai/claude-code-interface';
import { execa } from 'execa';

export class ClaudeCodePlugin extends AbstractDevAgentPlugin {
  private cliPath: string;
  private workingDirectory: string;

  constructor(config: ClaudeCodeConfig) {
    super();
    this.cliPath = config.cliPath ?? 'claude';
    this.workingDirectory = config.workingDirectory;
  }

  protected async doInvoke(prompt: string, options: InternalInvokeOptions): Promise<ClaudeCodeResult> {
    const args = this.buildArgs(prompt, options);
    const result = await execa(this.cliPath, args, {
      cwd: this.workingDirectory,
      signal: options.signal
    });
    return this.parseResult(result);
  }

  protected async doInvokeStream(prompt: string, options: InternalInvokeOptions): AsyncGenerator<StreamEvent> {
    // Stream via claude CLI with --stream and --output-format stream-json
  }

  async getCapabilities(): Promise<ClaudeCodeCapabilities> {
    // Query claude --version and capabilities
  }
}

export interface ClaudeCodeConfig {
  cliPath?: string;
  workingDirectory: string;
  model?: string;
  maxTokens?: number;
}
```

## Interface Package

```typescript
// @generacy-ai/claude-code-interface

import { AgentResult, AgentCapabilities } from '@generacy-ai/latency';

export interface ClaudeCodeResult extends AgentResult {
  /** Model used for the invocation */
  model: string;
  
  /** Token usage */
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  
  /** Files modified during invocation */
  modifiedFiles: string[];
  
  /** Tools called during invocation */
  toolCalls: ClaudeCodeToolCall[];
  
  /** Session ID for continuation */
  sessionId?: string;
}

export interface ClaudeCodeToolCall {
  name: string;
  input: unknown;
  output: unknown;
  duration: number;
}

export interface ClaudeCodeCapabilities extends AgentCapabilities {
  version: string;
  availableModels: string[];
  supportsMCP: boolean;
  supportsDocker: boolean;
}

export function isClaudeCodeResult(result: AgentResult): result is ClaudeCodeResult;

/** Claude Code-specific error codes */
export enum ClaudeCodeErrorCode {
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',
  AUTH_FAILURE = 'AUTH_FAILURE',
  RATE_LIMITED = 'RATE_LIMITED',
  PARSE_ERROR = 'PARSE_ERROR',
}
```

## Tasks

- [ ] Create both package directory structures
- [ ] Implement ClaudeCodePlugin extending abstract with `doInvoke` using `--output-format json`
- [ ] Implement `doInvokeStream` with Claude Code CLI streaming
- [ ] Implement CLI invocation with execa
- [ ] Define Claude Code-specific types in interface package
- [ ] Define Claude Code-specific error codes (`CLI_NOT_FOUND`, `AUTH_FAILURE`, `RATE_LIMITED`, `PARSE_ERROR`)
- [ ] Implement type guards and helpers
- [ ] Write tests with mocked CLI

## Dependencies

### Plugin
- `@generacy-ai/latency-plugin-dev-agent`
- `@generacy-ai/claude-code-interface`
- `execa`

### Interface
- `@generacy-ai/latency` (types only)

## User Stories

### US1: Invoke Claude Code Programmatically

**As a** developer building agent orchestration workflows,
**I want** to invoke Claude Code CLI through a typed plugin interface,
**So that** I can integrate Claude Code into automated pipelines with structured results.

**Acceptance Criteria**:
- [ ] Plugin invokes Claude Code CLI with `--output-format json` and returns structured `ClaudeCodeResult`
- [ ] Streaming invocation works via `doInvokeStream`
- [ ] Error conditions (CLI not found, auth failure, rate limit, parse error) return specific error codes
- [ ] Type guards correctly identify `ClaudeCodeResult` instances

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Invoke Claude Code CLI with `--output-format json` | P1 | Use execa |
| FR-002 | Parse JSON output into `ClaudeCodeResult` | P1 | model, usage, modifiedFiles, toolCalls, sessionId |
| FR-003 | Implement streaming via `doInvokeStream` | P1 | Abstract contract requirement |
| FR-004 | Report capabilities via `getCapabilities` | P2 | version, availableModels |
| FR-005 | Define Claude Code-specific error codes | P1 | CLI_NOT_FOUND, AUTH_FAILURE, RATE_LIMITED, PARSE_ERROR |
| FR-006 | Type guard `isClaudeCodeResult` | P2 | |

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | Unit test coverage | >80% | Jest coverage report |
| SC-002 | All abstract methods implemented | 100% | TypeScript compilation |
| SC-003 | Error codes distinguishable | All 4 codes | Unit tests for each error path |

## Assumptions

- Claude Code CLI is installed and available at the configured path
- CLI supports `--output-format json` flag
- CLI supports `--stream` flag for streaming output
- `@generacy-ai/latency-plugin-dev-agent` package is available (from #8)

## Out of Scope

- Docker container invocation (`invokeInDocker`) — separate follow-up issue
- MCP server configuration (`invokeWithMCP`) — separate follow-up issue
- Production deployment and monitoring
- CLI installation/update management

---

*Generated by speckit*
