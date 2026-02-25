// IDs and generation utilities
export {
  type CorrelationId,
  type RequestId,
  type SessionId,
  CorrelationIdSchema,
  RequestIdSchema,
  SessionIdSchema,
  generateCorrelationId,
  generateRequestId,
  generateSessionId,
} from './ids.js';

// Timestamps
export {
  type ISOTimestamp,
  ISOTimestampSchema,
  createTimestamp,
} from './timestamps.js';

// Pagination
export {
  type PaginationParams,
  type PaginatedResponse,
  PaginationParamsSchema,
  PaginatedResponseSchema,
} from './pagination.js';

// Error handling
export {
  ErrorCode,
  type ErrorResponse,
  ErrorCodeSchema,
  ErrorResponseSchema,
  createErrorResponse,
} from './errors.js';

// Urgency
export { Urgency, UrgencySchema } from './urgency.js';

// Configuration
export {
  type BaseConfig,
  BaseConfigSchema,
} from './config.js';

// Message envelope
export {
  type MessageMeta,
  type MessageEnvelope,
  MessageMetaSchema,
  MessageEnvelopeSchema,
  BaseMessageEnvelopeSchema,
} from './message-envelope.js';

// Version utilities
export {
  type SemVer,
  type ParseVersionOptions,
  parseVersion,
  compareVersions,
  isVersionCompatible,
  SemVerStringSchema,
  VersionRangeSchema,
} from './version.js';

// Capability system
export {
  Capability,
  CapabilitySchema,
  type CapabilityString,
  type CapabilityConfig,
  CapabilityConfigSchema,
  type DeprecationInfo,
  DeprecationInfoSchema,
  CapabilityMissingError,
  type CapabilityResult,
  type CapabilityQuery,
  createCapabilityQuery,
} from './capability.js';

// Extended metadata for schemas with plugin extensibility
export {
  type ExtendedMeta,
  ExtendedMetaSchema,
} from './extended-meta.js';
