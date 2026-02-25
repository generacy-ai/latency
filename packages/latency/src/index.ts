export type {
  FacetProvider,
  FacetRequirement,
  FacetDeclaration,
  PluginManifest,
  PluginContext,
  DecisionRequest,
  DecisionResult,
  Logger,
  PluginStateStore,
} from './composition/index.js';

export * from './facets/index.js';

export type {
  FacetRegistry,
  RegistrationOptions,
  FacetRegistration,
  Binder,
  BinderConfig,
  ExplicitBinding,
  BindingResult,
  BindingError,
} from './runtime/index.js';

export {
  FacetNotFoundError,
  AmbiguousFacetError,
  CircularDependencyError,
} from './runtime/index.js';

// Version compatibility exports
export {
  CAPABILITY_CONFIG,
  CAPABILITY_DEPS,
  validateCapabilityDependencies,
  getCapabilityConfig,
  isCapabilityDeprecated,
  getDeprecationInfo,
  getAllDependencies,
  type DependencyValidationResult,
  createVersionedSchema,
  getSchemaForVersion,
  type VersionedSchemaConfig,
  type SchemaVersionMap,
  VersionedDecisionRequest,
  type DeprecationWarning,
  DeprecationWarningSchema,
  collectDeprecationWarnings,
  formatDeprecationMessage,
  formatDeprecationMessages,
  hasDeprecatedCapabilities,
  getDeprecationReplacements,
} from './versioning/index.js';
