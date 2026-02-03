/**
 * Runtime binding primitives for the plugin architecture.
 *
 * This module provides the type-level contracts for facet registration,
 * dependency resolution, and plugin binding at startup. Each core
 * (Agency, Generacy, Humancy) implements these interfaces with its
 * own runtime.
 *
 * @module runtime
 */

export type {
  FacetRegistry,
  RegistrationOptions,
  FacetRegistration,
} from './registry.js';

export type {
  Binder,
  BinderConfig,
  ExplicitBinding,
  BindingResult,
} from './binder.js';

export {
  FacetNotFoundError,
  AmbiguousFacetError,
  CircularDependencyError,
} from './resolution.js';

export type { BindingError } from './resolution.js';
