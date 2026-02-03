import { describe, it, expect } from 'vitest';
import { FacetError } from '@generacy-ai/latency';
import { ValidationError } from '../src/validation.js';

describe('ValidationError', () => {
  it('extends FacetError', () => {
    const err = new ValidationError('test');
    expect(err).toBeInstanceOf(FacetError);
  });

  it('is instanceof ValidationError', () => {
    const err = new ValidationError('test');
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('is instanceof Error', () => {
    const err = new ValidationError('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('has code VALIDATION', () => {
    const err = new ValidationError('test');
    expect(err.code).toBe('VALIDATION');
  });

  it('has name ValidationError', () => {
    const err = new ValidationError('test');
    expect(err.name).toBe('ValidationError');
  });

  it('stores the message', () => {
    const err = new ValidationError('Issue title is required');
    expect(err.message).toBe('Issue title is required');
  });

  it('supports error chaining via cause', () => {
    const cause = new Error('underlying error');
    const err = new ValidationError('validation failed', { cause });
    expect(err.cause).toBe(cause);
  });

  it('works without options', () => {
    const err = new ValidationError('no options');
    expect(err.cause).toBeUndefined();
  });
});
