/**
 * Abstract source control plugin for the Latency ecosystem.
 *
 * Provides {@link AbstractSourceControlPlugin}, a base class that implements
 * the core {@link SourceControl} interface with input validation, delegating
 * actual VCS operations to protected abstract methods for subclasses.
 *
 * @packageDocumentation
 */

export { AbstractSourceControlPlugin } from './abstract-source-control-plugin.js';
export { ValidationError } from './validation-error.js';

// Re-export core types for consumer convenience
export type {
  SourceControl,
  Commit,
  CommitSpec,
  Branch,
  BranchSpec,
  DiffEntry,
  CommitQuery,
  PaginatedQuery,
  PaginatedResult,
} from '@generacy-ai/latency';
