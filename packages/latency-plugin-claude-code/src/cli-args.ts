import type { InternalInvokeOptions } from '@generacy-ai/latency-plugin-dev-agent';
import type { ClaudeCodeConfig } from '@generacy-ai/claude-code-interface';

/**
 * Build the CLI argument array for a Claude Code invocation.
 *
 * Maps {@link ClaudeCodeConfig} and {@link InternalInvokeOptions} to the
 * flags accepted by the `claude` CLI.
 *
 * @param prompt - The prompt text to send.
 * @param config - Plugin configuration.
 * @param options - Internal invoke options (metadata, etc.).
 * @param outputFormat - CLI output format: 'json' for batch, 'stream-json' for streaming.
 * @returns An array of CLI arguments.
 */
export function buildArgs(
  prompt: string,
  config: ClaudeCodeConfig,
  options: InternalInvokeOptions,
  outputFormat: 'json' | 'stream-json' = 'json',
): string[] {
  const args: string[] = ['-p', prompt, '--output-format', outputFormat];

  if (config.model) {
    args.push('--model', config.model);
  }

  if (config.maxTurns !== undefined) {
    args.push('--max-turns', String(config.maxTurns));
  }

  const metadata = options.metadata;
  if (metadata) {
    if (typeof metadata.systemPrompt === 'string') {
      args.push('--append-system-prompt', metadata.systemPrompt);
    }

    if (typeof metadata.allowedTools === 'string') {
      args.push('--allowedTools', metadata.allowedTools);
    }

    if (typeof metadata.maxBudgetUsd === 'number') {
      args.push('--max-budget-usd', String(metadata.maxBudgetUsd));
    }

    if (typeof metadata.sessionId === 'string') {
      args.push('--session-id', metadata.sessionId);
    }

    if (metadata.continueSession === true) {
      args.push('--continue');
    }

    if (typeof metadata.resumeSession === 'string') {
      args.push('--resume', metadata.resumeSession);
    }
  }

  return args;
}
