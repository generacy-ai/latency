import { describe, it, expect } from 'vitest';
import { FacetError } from '@generacy-ai/latency';
import { ClaudeCodeErrorCode } from '@generacy-ai/claude-code-interface';
import { parseResult, parseStreamEvent } from '../src/result-parser.js';

describe('parseResult', () => {
  const invocationId = 'inv_test_123';

  it('parses a successful CLI JSON result', () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'success',
      session_id: 'sess_abc',
      result: 'Hello, world!',
      is_error: false,
      duration_ms: 1000,
      duration_api_ms: 800,
      num_turns: 1,
      total_cost_usd: 0.05,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
      modelUsage: {
        'claude-sonnet-4-5-20250929': {
          inputTokens: 100,
          outputTokens: 50,
          costUSD: 0.05,
        },
      },
    });

    const result = parseResult(stdout, invocationId);

    expect(result.output).toBe('Hello, world!');
    expect(result.invocationId).toBe(invocationId);
    expect(result.model).toBe('claude-sonnet-4-5-20250929');
    expect(result.usage.inputTokens).toBe(100);
    expect(result.usage.outputTokens).toBe(50);
    expect(result.sessionId).toBe('sess_abc');
    expect(result.costUsd).toBe(0.05);
    expect(result.durationApiMs).toBe(800);
    expect(result.numTurns).toBe(1);
    expect(result.modifiedFiles).toEqual([]);
    expect(result.toolCalls).toEqual([]);
  });

  it('handles missing optional fields', () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'success',
      session_id: 'sess_min',
      result: 'Minimal output',
      is_error: false,
      usage: {
        input_tokens: 10,
        output_tokens: 5,
      },
    });

    const result = parseResult(stdout, invocationId);

    expect(result.output).toBe('Minimal output');
    expect(result.model).toBe('unknown');
    expect(result.costUsd).toBeUndefined();
    expect(result.durationApiMs).toBeUndefined();
    expect(result.numTurns).toBeUndefined();
  });

  it('throws PARSE_ERROR for invalid JSON', () => {
    expect(() => parseResult('not json', invocationId)).toThrow(FacetError);

    try {
      parseResult('not json', invocationId);
    } catch (err) {
      expect((err as FacetError).code).toBe(ClaudeCodeErrorCode.PARSE_ERROR);
    }
  });

  it('throws PARSE_ERROR for CLI error results', () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'error_max_turns',
      session_id: 'sess_err',
      is_error: true,
      errors: ['Max turns exceeded', 'Task incomplete'],
      usage: {
        input_tokens: 500,
        output_tokens: 200,
      },
    });

    expect(() => parseResult(stdout, invocationId)).toThrow(FacetError);

    try {
      parseResult(stdout, invocationId);
    } catch (err) {
      expect((err as FacetError).code).toBe(ClaudeCodeErrorCode.PARSE_ERROR);
      expect((err as FacetError).message).toContain('Max turns exceeded');
    }
  });

  it('handles empty result text', () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'success',
      session_id: 'sess_empty',
      is_error: false,
      usage: { input_tokens: 1, output_tokens: 0 },
    });

    const result = parseResult(stdout, invocationId);
    expect(result.output).toBe('');
  });
});

describe('parseStreamEvent', () => {
  it('returns a StreamChunk for assistant text events', () => {
    const event = JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'Hello from stream' },
        ],
      },
    });

    const chunk = parseStreamEvent(event);

    expect(chunk).not.toBeNull();
    expect(chunk!.text).toBe('Hello from stream');
    expect(chunk!.metadata?.type).toBe('assistant');
  });

  it('concatenates multiple text blocks', () => {
    const event = JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'Part 1 ' },
          { type: 'text', text: 'Part 2' },
        ],
      },
    });

    const chunk = parseStreamEvent(event);

    expect(chunk).not.toBeNull();
    expect(chunk!.text).toBe('Part 1 Part 2');
  });

  it('returns a StreamChunk for result events', () => {
    const event = JSON.stringify({
      type: 'result',
      subtype: 'success',
      result: 'Final result',
    });

    const chunk = parseStreamEvent(event);

    expect(chunk).not.toBeNull();
    expect(chunk!.text).toBe('Final result');
    expect(chunk!.metadata?.final).toBe(true);
  });

  it('returns null for system events', () => {
    const event = JSON.stringify({
      type: 'system',
      subtype: 'init',
      session_id: 'sess_123',
    });

    const chunk = parseStreamEvent(event);
    expect(chunk).toBeNull();
  });

  it('returns null for user events', () => {
    const event = JSON.stringify({
      type: 'user',
      message: { content: [{ type: 'tool_result' }] },
    });

    const chunk = parseStreamEvent(event);
    expect(chunk).toBeNull();
  });

  it('returns null for empty lines', () => {
    expect(parseStreamEvent('')).toBeNull();
    expect(parseStreamEvent('  ')).toBeNull();
  });

  it('returns null for assistant events without text content', () => {
    const event = JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          { type: 'tool_use', name: 'Read', input: {} },
        ],
      },
    });

    const chunk = parseStreamEvent(event);
    expect(chunk).toBeNull();
  });

  it('throws PARSE_ERROR for invalid JSON', () => {
    expect(() => parseStreamEvent('not json')).toThrow(FacetError);

    try {
      parseStreamEvent('not json');
    } catch (err) {
      expect((err as FacetError).code).toBe(ClaudeCodeErrorCode.PARSE_ERROR);
    }
  });
});
