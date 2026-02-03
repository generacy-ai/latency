import { describe, it, expect } from 'vitest';
import { FacetError } from '@generacy-ai/latency';
import { mapGitError } from '../src/errors.js';

describe('mapGitError', () => {
  it('maps "not a git repository" to NOT_FOUND', () => {
    const error = new Error('fatal: not a git repository (or any parent up to mount point /)');
    const result = mapGitError(error);
    expect(result).toBeInstanceOf(FacetError);
    expect(result.code).toBe('NOT_FOUND');
    expect(result.cause).toBe(error);
  });

  it('maps "pathspec did not match" to NOT_FOUND', () => {
    const error = new Error("error: pathspec 'nonexistent' did not match any file(s) known to git");
    const result = mapGitError(error);
    expect(result.code).toBe('NOT_FOUND');
  });

  it('maps "Permission denied" to AUTH_ERROR', () => {
    const error = new Error('Permission denied (publickey)');
    const result = mapGitError(error);
    expect(result.code).toBe('AUTH_ERROR');
  });

  it('maps "conflict" (lowercase) to CONFLICT', () => {
    const error = new Error('CONFLICT (content): Merge conflict in file.txt');
    const result = mapGitError(error);
    expect(result.code).toBe('CONFLICT');
  });

  it('maps "conflict" in mixed case to CONFLICT', () => {
    const error = new Error('Automatic merge failed; fix conflicts and then commit the result.');
    const result = mapGitError(error);
    expect(result.code).toBe('CONFLICT');
  });

  it('maps other errors to UNKNOWN', () => {
    const error = new Error('Something unexpected happened');
    const result = mapGitError(error);
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('Something unexpected happened');
  });

  it('maps non-Error objects to UNKNOWN with default message', () => {
    const result = mapGitError({ some: 'object' });
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('Unknown git error');
  });

  it('maps string errors', () => {
    const result = mapGitError('something went wrong');
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('something went wrong');
  });

  it('passes through FacetError instances unchanged', () => {
    const original = new FacetError('Already mapped', 'NOT_FOUND');
    const result = mapGitError(original);
    expect(result).toBe(original);
  });
});
