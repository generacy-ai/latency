import type { AgentResult, AgentCapabilities } from '@generacy-ai/latency';

/**
 * Configuration for the Claude Code plugin constructor.
 */
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

/**
 * Result of a Claude Code CLI invocation.
 *
 * Extends {@link AgentResult} with Claude Code-specific metadata
 * such as model, token usage, modified files, and tool calls.
 */
export interface ClaudeCodeResult extends AgentResult {
  /** Model used for the invocation (e.g., 'claude-sonnet-4-5-20250929'). */
  model: string;

  /** Token usage (required — overrides AgentResult.usage). */
  usage: {
    inputTokens: number;
    outputTokens: number;
  };

  /** Files modified during invocation (extracted from tool calls). */
  modifiedFiles: string[];

  /** Tools called during invocation. */
  toolCalls: ClaudeCodeToolCall[];

  /** Session ID for continuation. */
  sessionId?: string;

  /** Total cost in USD for this invocation. */
  costUsd?: number;

  /** Duration of API calls in milliseconds. */
  durationApiMs?: number;

  /** Number of agentic turns taken. */
  numTurns?: number;
}

/**
 * Represents a single tool invocation within a Claude Code session.
 */
export interface ClaudeCodeToolCall {
  /** Tool name (e.g., 'Read', 'Edit', 'Bash'). */
  name: string;

  /** Tool input parameters. */
  input: unknown;

  /** Tool output/result. */
  output: unknown;

  /** Duration of the tool call in milliseconds. */
  duration: number;
}

/**
 * Capabilities reported by a Claude Code agent.
 *
 * Extends {@link AgentCapabilities} with version and feature flags.
 */
export interface ClaudeCodeCapabilities extends AgentCapabilities {
  /** CLI version string (e.g., '1.0.33'). */
  version: string;

  /** Available model aliases. */
  availableModels: string[];

  /** Whether MCP is supported (always true for current Claude Code). */
  supportsMCP: boolean;

  /** Whether Docker invocation is supported (out of scope — false). */
  supportsDocker: boolean;
}
