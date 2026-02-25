// Extended metadata for schemas with plugin extensibility
export { ExtendedMetaSchema, type ExtendedMeta } from '../common/extended-meta.js';

// Tool Registration schemas, namespaces, and types
export {
  // Namespaces for versioned access
  ToolParameterSchema,
  ReturnSchema,
  ToolRegistration,
  // Backward-compatible schema aliases
  ToolParameterSchemaSchema,
  ReturnSchemaSchema,
  ToolRegistrationSchema,
  // Parse functions
  parseToolParameterSchema,
  safeParseToolParameterSchema,
  parseReturnSchema,
  safeParseReturnSchema,
  parseToolRegistration,
  safeParseToolRegistration,
} from './tool-registration.js';

// Tool Invocation schemas, namespaces, and types
export {
  // Namespaces for versioned access
  InvocationContext,
  ToolInvocation,
  // Backward-compatible schema aliases
  InvocationContextSchema,
  ToolInvocationSchema,
  // Parse functions
  parseInvocationContext,
  safeParseInvocationContext,
  parseToolInvocation,
  safeParseToolInvocation,
} from './tool-invocation.js';

// Tool Result schemas, namespaces, and types
export {
  // Namespaces for versioned access
  ToolError,
  ToolResult,
  // Backward-compatible schema aliases
  ToolErrorSchema,
  ToolResultSchema,
  // Parse functions
  parseToolError,
  safeParseToolError,
  parseToolResult,
  safeParseToolResult,
} from './tool-result.js';

// Mode Management schemas, namespaces, and types
export {
  // Namespaces for versioned access
  ModeDefinition,
  ModeChangeRequest,
  // Backward-compatible schema aliases
  ModeDefinitionSchema,
  ModeChangeRequestSchema,
  // Parse functions
  parseModeDefinition,
  safeParseModeDefinition,
  parseModeChangeRequest,
  safeParseModeChangeRequest,
} from './mode-management.js';

// Decision Request schemas, namespaces, and types
export {
  // Enums (not versioned)
  DecisionTypeSchema,
  UrgencyLevelSchema,
  // Namespaces for versioned access
  DecisionOption,
  DecisionRequest,
  // Backward-compatible schema aliases
  DecisionOptionSchema,
  DecisionRequestSchema,
  // Parse functions
  parseDecisionOption,
  safeParseDecisionOption,
  parseDecisionRequest,
  safeParseDecisionRequest,
} from './decision-request.js';
export type { DecisionType, UrgencyLevel } from './decision-request.js';

// Decision Response schemas, namespaces, and types
export {
  // Namespace for versioned access
  DecisionResponse,
  // Backward-compatible schema alias
  DecisionResponseSchema,
  // Parse functions
  parseDecisionResponse,
  safeParseDecisionResponse,
} from './decision-response.js';
