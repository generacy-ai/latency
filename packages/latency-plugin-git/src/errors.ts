import { FacetError } from '@generacy-ai/latency';

/**
 * Map a git error to a FacetError with a standard code.
 *
 * Error pattern mapping:
 * - "not a git repository" → NOT_FOUND
 * - "pathspec did not match" → NOT_FOUND
 * - "Permission denied" → AUTH_ERROR
 * - "conflict" / "CONFLICT" → CONFLICT
 * - Other → UNKNOWN
 */
export function mapGitError(error: unknown): FacetError {
  if (error instanceof FacetError) {
    return error;
  }

  const message = getErrorMessage(error);

  if (message.includes('not a git repository')) {
    return new FacetError(message, 'NOT_FOUND', { cause: error });
  }
  if (message.includes('pathspec') && message.includes('did not match')) {
    return new FacetError(message, 'NOT_FOUND', { cause: error });
  }
  if (message.includes('Permission denied')) {
    return new FacetError(message, 'AUTH_ERROR', { cause: error });
  }
  if (/conflict/i.test(message)) {
    return new FacetError(message, 'CONFLICT', { cause: error });
  }

  return new FacetError(message, 'UNKNOWN', { cause: error });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown git error';
}
