import { describe, it, expect } from 'vitest';
import { FacetError } from '@generacy-ai/latency';
import { mapGitHubError } from '../src/errors.js';

describe('mapGitHubError', () => {
  it('maps 404 to NOT_FOUND', () => {
    const error = Object.assign(new Error('Not Found'), { status: 404 });
    const result = mapGitHubError(error);
    expect(result).toBeInstanceOf(FacetError);
    expect(result.code).toBe('NOT_FOUND');
    expect(result.message).toBe('Not Found');
    expect(result.cause).toBe(error);
  });

  it('maps 401 to AUTH_ERROR', () => {
    const error = Object.assign(new Error('Bad credentials'), { status: 401 });
    const result = mapGitHubError(error);
    expect(result.code).toBe('AUTH_ERROR');
  });

  it('maps 403 to AUTH_ERROR', () => {
    const error = Object.assign(new Error('Forbidden'), { status: 403 });
    const result = mapGitHubError(error);
    expect(result.code).toBe('AUTH_ERROR');
  });

  it('maps 429 to RATE_LIMIT', () => {
    const error = Object.assign(new Error('Rate limit exceeded'), { status: 429 });
    const result = mapGitHubError(error);
    expect(result.code).toBe('RATE_LIMIT');
  });

  it('maps 422 to VALIDATION', () => {
    const error = Object.assign(new Error('Validation Failed'), { status: 422 });
    const result = mapGitHubError(error);
    expect(result.code).toBe('VALIDATION');
  });

  it('maps other status codes to UNKNOWN', () => {
    const error = Object.assign(new Error('Server Error'), { status: 500 });
    const result = mapGitHubError(error);
    expect(result.code).toBe('UNKNOWN');
  });

  it('maps errors without status to UNKNOWN', () => {
    const error = new Error('Network failure');
    const result = mapGitHubError(error);
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('Network failure');
  });

  it('maps non-Error objects to UNKNOWN with default message', () => {
    const result = mapGitHubError({ some: 'object' });
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('Unknown GitHub API error');
  });

  it('maps string errors', () => {
    const result = mapGitHubError('something went wrong');
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('something went wrong');
  });

  it('passes through FacetError instances unchanged', () => {
    const original = new FacetError('Already mapped', 'NOT_FOUND');
    const result = mapGitHubError(original);
    expect(result).toBe(original);
  });
});
