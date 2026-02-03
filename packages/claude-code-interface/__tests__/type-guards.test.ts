import { describe, it, expect } from 'vitest';
import type { AgentResult } from '@generacy-ai/latency';
import { isClaudeCodeResult } from '../src/index.js';

describe('isClaudeCodeResult', () => {
  it('returns true for a valid ClaudeCodeResult', () => {
    const result: AgentResult = {
      output: 'Hello',
      invocationId: 'inv_123',
      usage: { inputTokens: 10, outputTokens: 20 },
      model: 'claude-sonnet-4-5-20250929',
      modifiedFiles: ['src/index.ts'],
      toolCalls: [
        { name: 'Read', input: {}, output: {}, duration: 100 },
      ],
      sessionId: 'sess_abc',
    } as unknown as AgentResult;

    expect(isClaudeCodeResult(result)).toBe(true);
  });

  it('returns true when optional fields are absent', () => {
    const result: AgentResult = {
      output: 'Done',
      invocationId: 'inv_456',
      model: 'claude-opus-4-5-20251101',
      modifiedFiles: [],
      toolCalls: [],
    } as unknown as AgentResult;

    expect(isClaudeCodeResult(result)).toBe(true);
  });

  it('returns false for a plain AgentResult without Claude fields', () => {
    const result: AgentResult = {
      output: 'Plain result',
      invocationId: 'inv_789',
    };

    expect(isClaudeCodeResult(result)).toBe(false);
  });

  it('returns false when model is not a string', () => {
    const result: AgentResult = {
      output: 'Bad model',
      invocationId: 'inv_001',
      model: 42,
      modifiedFiles: [],
      toolCalls: [],
    } as unknown as AgentResult;

    expect(isClaudeCodeResult(result)).toBe(false);
  });

  it('returns false when modifiedFiles is not an array', () => {
    const result: AgentResult = {
      output: 'Bad files',
      invocationId: 'inv_002',
      model: 'claude-sonnet-4-5-20250929',
      modifiedFiles: 'not-an-array',
      toolCalls: [],
    } as unknown as AgentResult;

    expect(isClaudeCodeResult(result)).toBe(false);
  });

  it('returns false when toolCalls is not an array', () => {
    const result: AgentResult = {
      output: 'Bad calls',
      invocationId: 'inv_003',
      model: 'claude-sonnet-4-5-20250929',
      modifiedFiles: [],
      toolCalls: 'not-an-array',
    } as unknown as AgentResult;

    expect(isClaudeCodeResult(result)).toBe(false);
  });

  it('returns false when model field is missing', () => {
    const result: AgentResult = {
      output: 'No model',
      invocationId: 'inv_004',
      modifiedFiles: [],
      toolCalls: [],
    } as unknown as AgentResult;

    expect(isClaudeCodeResult(result)).toBe(false);
  });
});
