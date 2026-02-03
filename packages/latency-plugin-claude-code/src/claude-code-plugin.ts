import type {
  AgentResult,
  AgentCapabilities,
  StreamChunk,
} from '@generacy-ai/latency';
import { FacetError } from '@generacy-ai/latency';
import {
  AbstractDevAgentPlugin,
  type InternalInvokeOptions,
} from '@generacy-ai/latency-plugin-dev-agent';
import type {
  ClaudeCodeConfig,
  ClaudeCodeResult,
  ClaudeCodeCapabilities,
} from '@generacy-ai/claude-code-interface';
import { ClaudeCodeErrorCode } from '@generacy-ai/claude-code-interface';
import { execa } from 'execa';

import { buildArgs } from './cli-args.js';
import { parseResult, parseStreamEvent } from './result-parser.js';

/**
 * Claude Code CLI plugin for the Latency dev agent ecosystem.
 *
 * Invokes the `claude` CLI as a subprocess, supporting both batch
 * (`--output-format json`) and streaming (`--output-format stream-json`)
 * modes.
 *
 * @example
 * ```typescript
 * const plugin = new ClaudeCodePlugin({
 *   workingDirectory: '/path/to/project',
 *   model: 'sonnet',
 * });
 *
 * const result = await plugin.invoke('Explain the main entry point');
 * console.log(result.output);
 * ```
 */
export class ClaudeCodePlugin extends AbstractDevAgentPlugin {
  private readonly config: ClaudeCodeConfig;

  constructor(config: ClaudeCodeConfig) {
    super({ defaultTimeoutMs: config.defaultTimeoutMs });
    this.config = {
      ...config,
      cliPath: config.cliPath ?? 'claude',
    };
  }

  protected async doInvoke(
    prompt: string,
    options: InternalInvokeOptions,
  ): Promise<AgentResult> {
    const args = buildArgs(prompt, this.config, options, 'json');

    try {
      const result = await execa(this.config.cliPath!, args, {
        cwd: this.config.workingDirectory,
        cancelSignal: options.signal,
      });

      return parseResult(result.stdout, options.invocationId);
    } catch (error: unknown) {
      throw this.mapError(error);
    }
  }

  protected async *doInvokeStream(
    prompt: string,
    options: InternalInvokeOptions,
  ): AsyncIterableIterator<StreamChunk> {
    const args = buildArgs(prompt, this.config, options, 'stream-json');

    let subprocess;
    try {
      subprocess = execa(this.config.cliPath!, args, {
        cwd: this.config.workingDirectory,
        cancelSignal: options.signal,
        stdout: 'pipe',
      });
    } catch (error: unknown) {
      throw this.mapError(error);
    }

    const stdout = subprocess.stdout;
    if (!stdout) {
      throw new FacetError(
        'Failed to get stdout from Claude Code CLI process',
        ClaudeCodeErrorCode.PARSE_ERROR,
      );
    }

    let buffer = '';
    const decoder = new TextDecoder();

    try {
      for await (const data of stdout) {
        if (options.signal.aborted) {
          break;
        }

        buffer += decoder.decode(data as Buffer, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const chunk = parseStreamEvent(line);
          if (chunk) {
            yield chunk;
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        const chunk = parseStreamEvent(buffer);
        if (chunk) {
          yield chunk;
        }
      }
    } catch (error: unknown) {
      throw this.mapError(error);
    }
  }

  protected async doGetCapabilities(): Promise<AgentCapabilities> {
    try {
      const result = await execa(this.config.cliPath!, ['--version']);
      const version = result.stdout.trim();

      const capabilities: ClaudeCodeCapabilities = {
        streaming: true,
        cancellation: true,
        models: ['sonnet', 'opus', 'haiku'],
        version,
        availableModels: ['sonnet', 'opus', 'haiku'],
        supportsMCP: true,
        supportsDocker: false,
      };

      return capabilities;
    } catch (error: unknown) {
      throw this.mapError(error);
    }
  }

  /**
   * Map an error from execa or other sources to a FacetError with
   * an appropriate ClaudeCodeErrorCode.
   */
  private mapError(error: unknown): FacetError {
    if (error instanceof FacetError) {
      return error;
    }

    const err = error as NodeJS.ErrnoException & {
      stderr?: string;
      exitCode?: number;
      isCanceled?: boolean;
    };

    // CLI not found
    if (err.code === 'ENOENT') {
      return new FacetError(
        `Claude Code CLI not found at '${this.config.cliPath}'`,
        ClaudeCodeErrorCode.CLI_NOT_FOUND,
        { cause: error },
      );
    }

    // Cancelled by abort signal
    if (err.isCanceled) {
      return new FacetError('Invocation was cancelled', 'CANCELLED', {
        cause: error,
      });
    }

    const stderr = err.stderr ?? '';

    // Auth failure detection
    if (
      stderr.includes('authentication') ||
      stderr.includes('unauthorized') ||
      stderr.includes('API key') ||
      stderr.includes('auth')
    ) {
      return new FacetError(
        'Claude Code authentication failed',
        ClaudeCodeErrorCode.AUTH_FAILURE,
        { cause: error },
      );
    }

    // Rate limit detection
    if (
      stderr.includes('rate limit') ||
      stderr.includes('rate_limit') ||
      stderr.includes('too many requests')
    ) {
      return new FacetError(
        'Claude Code rate limited',
        ClaudeCodeErrorCode.RATE_LIMITED,
        { cause: error },
      );
    }

    // Generic error
    const message =
      err.message ?? (typeof error === 'string' ? error : 'Unknown error');
    return new FacetError(message, 'UNKNOWN', { cause: error });
  }
}
