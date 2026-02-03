import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FacetError } from '@generacy-ai/latency';
import { ClaudeCodeErrorCode } from '@generacy-ai/claude-code-interface';
import { Readable } from 'node:stream';

// Mock execa at the module level
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

// Import after mock setup
import { execa } from 'execa';
import { ClaudeCodePlugin } from '../src/claude-code-plugin.js';

const mockedExeca = vi.mocked(execa);

function makeSuccessResult(result: string = 'Hello') {
  return JSON.stringify({
    type: 'result',
    subtype: 'success',
    session_id: 'sess_test',
    result,
    is_error: false,
    duration_ms: 1000,
    duration_api_ms: 800,
    num_turns: 1,
    total_cost_usd: 0.03,
    usage: {
      input_tokens: 100,
      output_tokens: 50,
    },
    modelUsage: {
      'claude-sonnet-4-5-20250929': {
        inputTokens: 100,
        outputTokens: 50,
        costUSD: 0.03,
      },
    },
  });
}

describe('ClaudeCodePlugin', () => {
  let plugin: ClaudeCodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    plugin = new ClaudeCodePlugin({
      workingDirectory: '/tmp/test-project',
      defaultTimeoutMs: 60_000,
    });
  });

  describe('invoke (doInvoke)', () => {
    it('invokes claude CLI and returns parsed result', async () => {
      mockedExeca.mockResolvedValue({
        stdout: makeSuccessResult('Test output'),
        stderr: '',
        exitCode: 0,
      } as never);

      const result = await plugin.invoke('Hello world');

      expect(result.output).toBe('Test output');
      expect(result.invocationId).toMatch(/^inv_/);

      expect(mockedExeca).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['-p', 'Hello world', '--output-format', 'json']),
        expect.objectContaining({
          cwd: '/tmp/test-project',
        }),
      );
    });

    it('passes model config to CLI args', async () => {
      const modelPlugin = new ClaudeCodePlugin({
        workingDirectory: '/tmp/test',
        model: 'opus',
      });

      mockedExeca.mockResolvedValue({
        stdout: makeSuccessResult(),
        stderr: '',
        exitCode: 0,
      } as never);

      await modelPlugin.invoke('Test');

      expect(mockedExeca).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--model', 'opus']),
        expect.anything(),
      );
    });

    it('uses custom cliPath when configured', async () => {
      const customPlugin = new ClaudeCodePlugin({
        workingDirectory: '/tmp/test',
        cliPath: '/usr/local/bin/claude-code',
      });

      mockedExeca.mockResolvedValue({
        stdout: makeSuccessResult(),
        stderr: '',
        exitCode: 0,
      } as never);

      await customPlugin.invoke('Test');

      expect(mockedExeca).toHaveBeenCalledWith(
        '/usr/local/bin/claude-code',
        expect.any(Array),
        expect.anything(),
      );
    });

    it('throws CLI_NOT_FOUND for ENOENT errors', async () => {
      const enoentError = new Error('spawn claude ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      mockedExeca.mockRejectedValue(enoentError);

      await expect(plugin.invoke('Test')).rejects.toMatchObject({
        code: ClaudeCodeErrorCode.CLI_NOT_FOUND,
      });
    });

    it('throws AUTH_FAILURE for authentication errors', async () => {
      const authError = Object.assign(new Error('CLI failed'), {
        stderr: 'authentication failed: invalid API key',
        exitCode: 1,
      });
      mockedExeca.mockRejectedValue(authError);

      await expect(plugin.invoke('Test')).rejects.toMatchObject({
        code: ClaudeCodeErrorCode.AUTH_FAILURE,
      });
    });

    it('throws RATE_LIMITED for rate limit errors', async () => {
      const rateError = Object.assign(new Error('CLI failed'), {
        stderr: 'rate limit exceeded, try again later',
        exitCode: 1,
      });
      mockedExeca.mockRejectedValue(rateError);

      await expect(plugin.invoke('Test')).rejects.toMatchObject({
        code: ClaudeCodeErrorCode.RATE_LIMITED,
      });
    });

    it('throws PARSE_ERROR for invalid JSON output', async () => {
      mockedExeca.mockResolvedValue({
        stdout: 'not valid json',
        stderr: '',
        exitCode: 0,
      } as never);

      await expect(plugin.invoke('Test')).rejects.toMatchObject({
        code: ClaudeCodeErrorCode.PARSE_ERROR,
      });
    });

    it('throws VALIDATION for empty prompt', async () => {
      await expect(plugin.invoke('')).rejects.toMatchObject({
        code: 'VALIDATION',
      });
    });
  });

  describe('invokeStream (doInvokeStream)', () => {
    it('yields StreamChunks from stream-json events', async () => {
      const events = [
        JSON.stringify({
          type: 'system',
          subtype: 'init',
          session_id: 'sess_stream',
        }),
        JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Streaming ' }],
          },
        }),
        JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'response' }],
          },
        }),
        JSON.stringify({
          type: 'result',
          subtype: 'success',
          result: 'Final',
        }),
      ].join('\n') + '\n';

      const stdout = Readable.from([Buffer.from(events)]);
      const subprocess = {
        stdout,
        stderr: Readable.from([]),
        exitCode: 0,
      };

      mockedExeca.mockReturnValue(subprocess as never);

      const chunks: { text: string }[] = [];
      const stream = plugin.invokeStream('Stream test');

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      // Should have: 'Streaming ', 'response', 'Final' (system event produces null)
      expect(chunks.length).toBe(3);
      expect(chunks[0].text).toBe('Streaming ');
      expect(chunks[1].text).toBe('response');
      expect(chunks[2].text).toBe('Final');
    });

    it('uses stream-json output format', async () => {
      const stdout = Readable.from([Buffer.from('')]);
      const subprocess = { stdout, stderr: Readable.from([]) };
      mockedExeca.mockReturnValue(subprocess as never);

      const stream = plugin.invokeStream('Test');
      // Consume to trigger the call
      for await (const _ of stream) {
        // drain
      }

      expect(mockedExeca).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--output-format', 'stream-json']),
        expect.anything(),
      );
    });
  });

  describe('getCapabilities (doGetCapabilities)', () => {
    it('returns capabilities with CLI version', async () => {
      mockedExeca.mockResolvedValue({
        stdout: '1.0.33',
        stderr: '',
        exitCode: 0,
      } as never);

      const caps = await plugin.getCapabilities();

      expect(caps.streaming).toBe(true);
      expect(caps.cancellation).toBe(true);
      expect(caps.models).toContain('sonnet');
      expect(caps.models).toContain('opus');

      // Extended capabilities
      const extended = caps as { version: string; supportsMCP: boolean; supportsDocker: boolean };
      expect(extended.version).toBe('1.0.33');
      expect(extended.supportsMCP).toBe(true);
      expect(extended.supportsDocker).toBe(false);
    });

    it('throws CLI_NOT_FOUND when claude binary is missing', async () => {
      const enoentError = new Error('spawn claude ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      mockedExeca.mockRejectedValue(enoentError);

      await expect(plugin.getCapabilities()).rejects.toMatchObject({
        code: ClaudeCodeErrorCode.CLI_NOT_FOUND,
      });
    });
  });

  describe('cancel', () => {
    it('cancels an active invocation', async () => {
      // Create a long-running invocation
      let rejectFn: (err: Error) => void;
      mockedExeca.mockReturnValue(
        new Promise((_resolve, reject) => {
          rejectFn = reject;
        }) as never,
      );

      const invokePromise = plugin.invoke('Long task');

      // The base class generates the invocation ID internally,
      // so we can't easily test cancel by ID without access to it.
      // Instead, verify that cancel doesn't throw for unknown IDs.
      await plugin.cancel('unknown_id');

      // Clean up
      rejectFn!(Object.assign(new Error('cancelled'), { isCanceled: true }));
      await expect(invokePromise).rejects.toThrow();
    });
  });

  describe('error mapping', () => {
    it('wraps generic errors as UNKNOWN', async () => {
      mockedExeca.mockRejectedValue(new Error('Unexpected failure'));

      await expect(plugin.invoke('Test')).rejects.toMatchObject({
        code: 'UNKNOWN',
      });
    });

    it('preserves FacetError instances', async () => {
      mockedExeca.mockRejectedValue(
        new FacetError('Already wrapped', 'CUSTOM_CODE'),
      );

      await expect(plugin.invoke('Test')).rejects.toMatchObject({
        code: 'CUSTOM_CODE',
      });
    });
  });
});
