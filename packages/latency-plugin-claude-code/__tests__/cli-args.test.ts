import { describe, it, expect } from 'vitest';
import type { InternalInvokeOptions } from '@generacy-ai/latency-plugin-dev-agent';
import type { ClaudeCodeConfig } from '@generacy-ai/claude-code-interface';
import { buildArgs } from '../src/cli-args.js';

function makeOptions(
  overrides?: Partial<InternalInvokeOptions>,
): InternalInvokeOptions {
  return {
    invocationId: 'inv_test',
    signal: AbortSignal.timeout(30_000),
    ...overrides,
  };
}

describe('buildArgs', () => {
  const baseConfig: ClaudeCodeConfig = {
    workingDirectory: '/tmp/test',
  };

  it('includes prompt and output format', () => {
    const args = buildArgs('Hello world', baseConfig, makeOptions());

    expect(args).toContain('-p');
    expect(args).toContain('Hello world');
    expect(args).toContain('--output-format');
    expect(args).toContain('json');
  });

  it('uses stream-json format when specified', () => {
    const args = buildArgs('Hello', baseConfig, makeOptions(), 'stream-json');

    expect(args).toContain('--output-format');
    expect(args).toContain('stream-json');
  });

  it('includes --model when configured', () => {
    const config: ClaudeCodeConfig = { ...baseConfig, model: 'opus' };
    const args = buildArgs('Hello', config, makeOptions());

    expect(args).toContain('--model');
    expect(args).toContain('opus');
  });

  it('does not include --model when not configured', () => {
    const args = buildArgs('Hello', baseConfig, makeOptions());

    expect(args).not.toContain('--model');
  });

  it('includes --max-turns when configured', () => {
    const config: ClaudeCodeConfig = { ...baseConfig, maxTurns: 5 };
    const args = buildArgs('Hello', config, makeOptions());

    expect(args).toContain('--max-turns');
    expect(args).toContain('5');
  });

  it('includes --append-system-prompt from metadata', () => {
    const options = makeOptions({
      metadata: { systemPrompt: 'Be concise' },
    });
    const args = buildArgs('Hello', baseConfig, options);

    expect(args).toContain('--append-system-prompt');
    expect(args).toContain('Be concise');
  });

  it('includes --allowedTools from metadata', () => {
    const options = makeOptions({
      metadata: { allowedTools: 'Read,Edit,Bash' },
    });
    const args = buildArgs('Hello', baseConfig, options);

    expect(args).toContain('--allowedTools');
    expect(args).toContain('Read,Edit,Bash');
  });

  it('includes --max-budget-usd from metadata', () => {
    const options = makeOptions({
      metadata: { maxBudgetUsd: 1.5 },
    });
    const args = buildArgs('Hello', baseConfig, options);

    expect(args).toContain('--max-budget-usd');
    expect(args).toContain('1.5');
  });

  it('includes --session-id from metadata', () => {
    const options = makeOptions({
      metadata: { sessionId: 'sess_abc123' },
    });
    const args = buildArgs('Hello', baseConfig, options);

    expect(args).toContain('--session-id');
    expect(args).toContain('sess_abc123');
  });

  it('includes --continue when metadata.continueSession is true', () => {
    const options = makeOptions({
      metadata: { continueSession: true },
    });
    const args = buildArgs('Hello', baseConfig, options);

    expect(args).toContain('--continue');
  });

  it('does not include --continue when metadata.continueSession is false', () => {
    const options = makeOptions({
      metadata: { continueSession: false },
    });
    const args = buildArgs('Hello', baseConfig, options);

    expect(args).not.toContain('--continue');
  });

  it('includes --resume from metadata', () => {
    const options = makeOptions({
      metadata: { resumeSession: 'sess_resume_id' },
    });
    const args = buildArgs('Hello', baseConfig, options);

    expect(args).toContain('--resume');
    expect(args).toContain('sess_resume_id');
  });

  it('handles multiple metadata options simultaneously', () => {
    const config: ClaudeCodeConfig = {
      ...baseConfig,
      model: 'sonnet',
      maxTurns: 10,
    };
    const options = makeOptions({
      metadata: {
        systemPrompt: 'Be helpful',
        sessionId: 'sess_multi',
      },
    });
    const args = buildArgs('Complex prompt', config, options);

    expect(args).toContain('--model');
    expect(args).toContain('sonnet');
    expect(args).toContain('--max-turns');
    expect(args).toContain('10');
    expect(args).toContain('--append-system-prompt');
    expect(args).toContain('Be helpful');
    expect(args).toContain('--session-id');
    expect(args).toContain('sess_multi');
  });

  it('handles no metadata gracefully', () => {
    const args = buildArgs('Hello', baseConfig, makeOptions());

    // Should only have base args: -p, prompt, --output-format, json
    expect(args).toEqual(['-p', 'Hello', '--output-format', 'json']);
  });
});
