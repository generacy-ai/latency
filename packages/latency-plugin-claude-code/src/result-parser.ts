import type { StreamChunk } from '@generacy-ai/latency';
import type { ClaudeCodeResult, ClaudeCodeToolCall } from '@generacy-ai/claude-code-interface';
import { ClaudeCodeErrorCode } from '@generacy-ai/claude-code-interface';
import { FacetError } from '@generacy-ai/latency';

/**
 * Shape of the JSON object emitted by `claude -p --output-format json`.
 */
interface CliJsonOutput {
  type: 'result';
  subtype: string;
  session_id: string;
  result?: string;
  is_error: boolean;
  errors?: string[];
  duration_ms?: number;
  duration_api_ms?: number;
  num_turns?: number;
  total_cost_usd?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  modelUsage?: Record<string, {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
    costUSD?: number;
    contextWindow?: number;
  }>;
}

/**
 * Parse the JSON stdout from `claude -p --output-format json` into a
 * {@link ClaudeCodeResult}.
 *
 * @param stdout - Raw JSON string from the CLI.
 * @param invocationId - The invocation ID assigned by the base class.
 * @returns A fully populated {@link ClaudeCodeResult}.
 * @throws {FacetError} With code {@link ClaudeCodeErrorCode.PARSE_ERROR} if JSON parsing fails.
 */
export function parseResult(
  stdout: string,
  invocationId: string,
): ClaudeCodeResult {
  let parsed: CliJsonOutput;
  try {
    parsed = JSON.parse(stdout) as CliJsonOutput;
  } catch {
    throw new FacetError(
      'Failed to parse Claude Code CLI JSON output',
      ClaudeCodeErrorCode.PARSE_ERROR,
    );
  }

  if (parsed.is_error) {
    const errorMessage = parsed.errors?.join('; ') ?? 'Unknown CLI error';
    throw new FacetError(
      `Claude Code CLI error: ${errorMessage}`,
      ClaudeCodeErrorCode.PARSE_ERROR,
    );
  }

  const model = extractModel(parsed);

  return {
    output: parsed.result ?? '',
    invocationId,
    model,
    usage: {
      inputTokens: parsed.usage?.input_tokens ?? 0,
      outputTokens: parsed.usage?.output_tokens ?? 0,
    },
    modifiedFiles: extractModifiedFiles(parsed),
    toolCalls: extractToolCalls(parsed),
    sessionId: parsed.session_id,
    costUsd: parsed.total_cost_usd,
    durationApiMs: parsed.duration_api_ms,
    numTurns: parsed.num_turns,
  };
}

/**
 * Shape of a single event in the stream-json format.
 */
interface StreamJsonEvent {
  type: string;
  subtype?: string;
  session_id?: string;
  // assistant message events
  message?: {
    content?: Array<{
      type: string;
      text?: string;
      name?: string;
      input?: unknown;
      id?: string;
    }>;
  };
  // result events (same as batch output)
  result?: string;
  is_error?: boolean;
  errors?: string[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Parse a single newline-delimited JSON event from `--output-format stream-json`
 * into a {@link StreamChunk}, or return `null` if the event doesn't contain
 * user-facing text.
 *
 * @param line - A single JSON line from the stream.
 * @returns A {@link StreamChunk} if the event contains text, or `null`.
 * @throws {FacetError} With code {@link ClaudeCodeErrorCode.PARSE_ERROR} if JSON parsing fails.
 */
export function parseStreamEvent(line: string): StreamChunk | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let event: StreamJsonEvent;
  try {
    event = JSON.parse(trimmed) as StreamJsonEvent;
  } catch {
    throw new FacetError(
      'Failed to parse stream-json event',
      ClaudeCodeErrorCode.PARSE_ERROR,
    );
  }

  if (event.type === 'assistant' && event.message?.content) {
    const textBlocks = event.message.content.filter(
      (block) => block.type === 'text' && typeof block.text === 'string',
    );
    if (textBlocks.length > 0) {
      const text = textBlocks.map((b) => b.text!).join('');
      return { text, metadata: { type: event.type, subtype: event.subtype } };
    }
  }

  if (event.type === 'result' && typeof event.result === 'string') {
    return {
      text: event.result,
      metadata: { type: 'result', subtype: event.subtype, final: true },
    };
  }

  return null;
}

/**
 * Extract the primary model name from CLI output.
 */
function extractModel(parsed: CliJsonOutput): string {
  if (parsed.modelUsage) {
    const models = Object.keys(parsed.modelUsage);
    if (models.length > 0) {
      return models[0];
    }
  }
  return 'unknown';
}

/**
 * Extract modified file paths from the CLI result.
 *
 * Currently returns an empty array since the batch JSON output doesn't
 * include per-tool-call details. Modified files would need to be
 * extracted from the streaming conversation messages.
 */
function extractModifiedFiles(_parsed: CliJsonOutput): string[] {
  // The batch JSON result doesn't include tool call details;
  // modified files are only available via streaming mode conversation.
  return [];
}

/**
 * Extract tool calls from the CLI result.
 *
 * Currently returns an empty array since the batch JSON output doesn't
 * include per-tool-call details.
 */
function extractToolCalls(_parsed: CliJsonOutput): ClaudeCodeToolCall[] {
  // The batch JSON result doesn't include tool call details;
  // tool calls are only available via streaming mode conversation.
  return [];
}
