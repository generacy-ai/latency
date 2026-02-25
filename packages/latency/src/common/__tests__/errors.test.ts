import { describe, it, expect } from 'vitest';
import {
  ErrorCode,
  ErrorCodeSchema,
  ErrorResponseSchema,
  createErrorResponse,
} from '../errors.js';

describe('ErrorCode', () => {
  it('has all expected error codes', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCode.TIMEOUT).toBe('TIMEOUT');
    expect(ErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCode.PLUGIN_ERROR).toBe('PLUGIN_ERROR');
    expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
  });
});

describe('ErrorCodeSchema', () => {
  it('accepts valid error codes', () => {
    Object.values(ErrorCode).forEach((code) => {
      const result = ErrorCodeSchema.safeParse(code);
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid error codes', () => {
    const result = ErrorCodeSchema.safeParse('INVALID_CODE');
    expect(result.success).toBe(false);
  });
});

describe('ErrorResponseSchema', () => {
  it('accepts valid error response', () => {
    const result = ErrorResponseSchema.safeParse({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      retryable: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts error response with all fields', () => {
    const result = ErrorResponseSchema.safeParse({
      code: 'RATE_LIMITED',
      message: 'Too many requests',
      details: { limit: 100, remaining: 0 },
      retryable: true,
      retryAfter: 60000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative retryAfter', () => {
    const result = ErrorResponseSchema.safeParse({
      code: 'TIMEOUT',
      message: 'Request timed out',
      retryable: true,
      retryAfter: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = ErrorResponseSchema.safeParse({
      code: 'NOT_FOUND',
      // missing message and retryable
    });
    expect(result.success).toBe(false);
  });
});

describe('createErrorResponse', () => {
  it('creates error response with defaults', () => {
    const error = createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Bad input');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Bad input');
    expect(error.retryable).toBe(false); // VALIDATION_ERROR is not retryable by default
    expect(error.details).toBeUndefined();
    expect(error.retryAfter).toBeUndefined();
  });

  it('sets retryable true by default for retryable error codes', () => {
    const timeoutError = createErrorResponse(ErrorCode.TIMEOUT, 'Timed out');
    expect(timeoutError.retryable).toBe(true);

    const rateLimitError = createErrorResponse(ErrorCode.RATE_LIMITED, 'Too many requests');
    expect(rateLimitError.retryable).toBe(true);

    const networkError = createErrorResponse(ErrorCode.NETWORK_ERROR, 'Connection failed');
    expect(networkError.retryable).toBe(true);
  });

  it('allows overriding retryable', () => {
    const error = createErrorResponse(ErrorCode.TIMEOUT, 'Timed out', {
      retryable: false,
    });
    expect(error.retryable).toBe(false);
  });

  it('includes details and retryAfter when provided', () => {
    const error = createErrorResponse(ErrorCode.RATE_LIMITED, 'Rate limited', {
      details: { quota: 100 },
      retryAfter: 5000,
    });
    expect(error.details).toEqual({ quota: 100 });
    expect(error.retryAfter).toBe(5000);
  });
});
