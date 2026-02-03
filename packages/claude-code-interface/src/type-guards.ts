import type { AgentResult } from '@generacy-ai/latency';
import type { ClaudeCodeResult } from './types.js';

/**
 * Type guard to check if an {@link AgentResult} is a {@link ClaudeCodeResult}.
 *
 * Checks for the presence of Claude Code-specific fields: `model`,
 * `modifiedFiles`, and `toolCalls`.
 */
export function isClaudeCodeResult(
  result: AgentResult,
): result is ClaudeCodeResult {
  return (
    'model' in result &&
    typeof (result as ClaudeCodeResult).model === 'string' &&
    'modifiedFiles' in result &&
    Array.isArray((result as ClaudeCodeResult).modifiedFiles) &&
    'toolCalls' in result &&
    Array.isArray((result as ClaudeCodeResult).toolCalls)
  );
}
