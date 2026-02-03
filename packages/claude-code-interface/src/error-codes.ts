/**
 * Error codes for Claude Code-specific failures.
 *
 * Used as the `code` field in {@link import('@generacy-ai/latency').FacetError}.
 */
export enum ClaudeCodeErrorCode {
  /** claude binary not found at configured path. */
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',

  /** Authentication or API key failure. */
  AUTH_FAILURE = 'AUTH_FAILURE',

  /** Rate limited by the API. */
  RATE_LIMITED = 'RATE_LIMITED',

  /** Failed to parse CLI JSON output. */
  PARSE_ERROR = 'PARSE_ERROR',
}
