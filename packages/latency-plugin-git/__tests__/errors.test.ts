import { describe, it, expect } from 'vitest';
import { FacetError } from '@generacy-ai/latency';
import { mapGitError } from '../src/errors.js';

describe('mapGitError', () => {
  it('returns the same error if already a FacetError', () => {
    const original = new FacetError('already mapped', 'CUSTOM');
    const result = mapGitError(original);
    expect(result).toBe(original);
  });

  it('maps "not a git repository" to NOT_FOUND', () => {
    const error = new Error('fatal: not a git repository (or any of the parent directories): .git');
    const result = mapGitError(error);
    expect(result).toBeInstanceOf(FacetError);
    expect(result.code).toBe('NOT_FOUND');
    expect(result.cause).toBe(error);
  });

  it('maps "pathspec did not match" to NOT_FOUND', () => {
    const error = new Error("error: pathspec 'nonexistent' did not match any file(s) known to git");
    const result = mapGitError(error);
    expect(result).toBeInstanceOf(FacetError);
    expect(result.code).toBe('NOT_FOUND');
  });

  it('maps "Permission denied" to AUTH_ERROR', () => {
    const error = new Error('Permission denied (publickey)');
    const result = mapGitError(error);
    expect(result).toBeInstanceOf(FacetError);
    expect(result.code).toBe('AUTH_ERROR');
  });

  it('maps "conflict" (lowercase) to CONFLICT', () => {
    const error = new Error('Merge conflict in file.txt');
    const result = mapGitError(error);
    expect(result).toBeInstanceOf(FacetError);
    expect(result.code).toBe('CONFLICT');
  });

  it('maps "CONFLICT" (uppercase) to CONFLICT', () => {
    const error = new Error('CONFLICT (content): Merge conflict in file.txt');
    const result = mapGitError(error);
    expect(result).toBeInstanceOf(FacetError);
    expect(result.code).toBe('CONFLICT');
  });

  it('maps unknown errors to UNKNOWN', () => {
    const error = new Error('some unexpected error');
    const result = mapGitError(error);
    expect(result).toBeInstanceOf(FacetError);
    expect(result.code).toBe('UNKNOWN');
    expect(result.cause).toBe(error);
  });

  it('handles string errors', () => {
    const result = mapGitError('string error');
    expect(result).toBeInstanceOf(FacetError);
    expect(result.message).toBe('string error');
    expect(result.code).toBe('UNKNOWN');
  });

  it('handles non-Error non-string values', () => {
    const result = mapGitError(42);
    expect(result).toBeInstanceOf(FacetError);
    expect(result.message).toBe('Unknown git error');
    expect(result.code).toBe('UNKNOWN');
  });
});
