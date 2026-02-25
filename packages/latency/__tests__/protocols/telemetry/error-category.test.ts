import { describe, it, expect } from 'vitest';
import { ErrorCategory, ErrorCategorySchema } from '../../../src/protocols/telemetry/error-category.js';

describe('ErrorCategory', () => {
  it('has all expected error categories', () => {
    expect(ErrorCategory.VALIDATION).toBe('validation');
    expect(ErrorCategory.TIMEOUT).toBe('timeout');
    expect(ErrorCategory.PERMISSION).toBe('permission');
    expect(ErrorCategory.NETWORK).toBe('network');
    expect(ErrorCategory.INTERNAL).toBe('internal');
    expect(ErrorCategory.UNKNOWN).toBe('unknown');
  });

  it('has exactly 6 categories', () => {
    expect(Object.keys(ErrorCategory)).toHaveLength(6);
  });
});

describe('ErrorCategorySchema', () => {
  it('accepts valid error categories', () => {
    Object.values(ErrorCategory).forEach((category) => {
      const result = ErrorCategorySchema.safeParse(category);
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid error categories', () => {
    const result = ErrorCategorySchema.safeParse('INVALID_CATEGORY');
    expect(result.success).toBe(false);
  });

  it('rejects empty string', () => {
    const result = ErrorCategorySchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects uppercase variants', () => {
    const result = ErrorCategorySchema.safeParse('VALIDATION');
    expect(result.success).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(ErrorCategorySchema.safeParse(123).success).toBe(false);
    expect(ErrorCategorySchema.safeParse(null).success).toBe(false);
    expect(ErrorCategorySchema.safeParse(undefined).success).toBe(false);
  });
});
