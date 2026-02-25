import { describe, it, expect } from 'vitest';
import {
  ToolErrorSchema,
  ToolResultSchema,
  parseToolResult,
  safeParseToolResult,
} from '../../../src/protocols/agency-humancy/tool-result.js';

describe('ToolError', () => {
  it('should validate a valid error', () => {
    const validError = {
      code: 'tool.not_found',
      message: 'The specified tool was not found',
      details: { toolName: 'unknown.tool' },
    };
    expect(ToolErrorSchema.parse(validError)).toEqual(validError);
  });

  it('should require error code', () => {
    const invalid = {
      code: '',
      message: 'Error message',
    };
    expect(ToolErrorSchema.safeParse(invalid).success).toBe(false);
  });

  it('should require error message', () => {
    const invalid = {
      code: 'tool.error',
      message: '',
    };
    expect(ToolErrorSchema.safeParse(invalid).success).toBe(false);
  });

  it('should validate namespaced error codes', () => {
    const validCodes = [
      'tool.not_found',
      'auth.failed',
      'validation.invalid_params',
      'namespace.sub.error_name',
    ];
    for (const code of validCodes) {
      const error = { code, message: 'test' };
      expect(ToolErrorSchema.safeParse(error).success).toBe(true);
    }
  });

  it('should reject invalid error code formats', () => {
    const invalidCodes = [
      'InvalidCode',
      'UPPERCASE',
      '123.error',
      'error-with-dash',
    ];
    for (const code of invalidCodes) {
      const error = { code, message: 'test' };
      expect(ToolErrorSchema.safeParse(error).success).toBe(false);
    }
  });

  it('should allow optional details', () => {
    const errorWithoutDetails = {
      code: 'tool.error',
      message: 'An error occurred',
    };
    expect(ToolErrorSchema.parse(errorWithoutDetails)).toEqual(errorWithoutDetails);
  });
});

describe('ToolResult', () => {
  it('should validate a successful result', () => {
    const validResult = {
      invocationId: 'inv-123',
      success: true,
      output: { sha: 'abc123' },
      durationMs: 150,
    };
    expect(parseToolResult(validResult)).toEqual(validResult);
  });

  it('should validate a failed result with error', () => {
    const failedResult = {
      invocationId: 'inv-123',
      success: false,
      error: {
        code: 'tool.failed',
        message: 'Operation failed',
      },
      durationMs: 50,
    };
    expect(safeParseToolResult(failedResult).success).toBe(true);
  });

  it('should reject failed result without error', () => {
    const invalid = {
      invocationId: 'inv-123',
      success: false,
      durationMs: 50,
    };
    expect(safeParseToolResult(invalid).success).toBe(false);
  });

  it('should allow successful result with both output and no error', () => {
    const valid = {
      invocationId: 'inv-123',
      success: true,
      output: 'result',
      durationMs: 100,
    };
    expect(safeParseToolResult(valid).success).toBe(true);
  });

  it('should reject negative duration', () => {
    const invalid = {
      invocationId: 'inv-123',
      success: true,
      durationMs: -1,
    };
    expect(safeParseToolResult(invalid).success).toBe(false);
  });

  it('should allow zero duration', () => {
    const valid = {
      invocationId: 'inv-123',
      success: true,
      durationMs: 0,
    };
    expect(safeParseToolResult(valid).success).toBe(true);
  });

  it('should require invocationId', () => {
    const invalid = {
      invocationId: '',
      success: true,
      durationMs: 100,
    };
    expect(safeParseToolResult(invalid).success).toBe(false);
  });
});
