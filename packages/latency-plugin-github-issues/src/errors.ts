import { FacetError } from '@generacy-ai/latency';

/**
 * Map a GitHub API error (from Octokit) to a FacetError with a standard code.
 *
 * HTTP status mapping:
 * - 404 → NOT_FOUND
 * - 401, 403 → AUTH_ERROR
 * - 429 → RATE_LIMIT
 * - 422 → VALIDATION
 * - Other → UNKNOWN
 */
export function mapGitHubError(error: unknown): FacetError {
  if (error instanceof FacetError) {
    return error;
  }

  const status = getStatusCode(error);
  const message = getErrorMessage(error);

  if (status === 404) {
    return new FacetError(message, 'NOT_FOUND', { cause: error });
  }
  if (status === 401 || status === 403) {
    return new FacetError(message, 'AUTH_ERROR', { cause: error });
  }
  if (status === 429) {
    return new FacetError(message, 'RATE_LIMIT', { cause: error });
  }
  if (status === 422) {
    return new FacetError(message, 'VALIDATION', { cause: error });
  }

  return new FacetError(message, 'UNKNOWN', { cause: error });
}

function getStatusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return (error as { status: number }).status;
  }
  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown GitHub API error';
}
