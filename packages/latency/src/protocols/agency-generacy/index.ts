// Protocol Handshake
export {
  ComponentSchema,
  ProtocolHandshakeSchema,
  ProtocolHandshakeResponseSchema,
  ProtocolNegotiationErrorDetailsSchema,
  ProtocolNegotiationErrorSchema,
  ProtocolHandshakeResultSchema,
  negotiateProtocol,
  negotiateWithWarnings,
  createProtocolNegotiationError,
  createHandshakeResponse,
  parseProtocolHandshake,
  safeParseProtocolHandshake,
  parseProtocolHandshakeResponse,
  safeParseProtocolHandshakeResponse,
  parseProtocolHandshakeResult,
  safeParseProtocolHandshakeResult,
} from './protocol-handshake.js';
export type {
  Component,
  ProtocolHandshake,
  ProtocolHandshakeResponse,
  ProtocolNegotiationErrorDetails,
  ProtocolNegotiationError,
  ProtocolHandshakeResult,
  NegotiateWithWarningsOptions,
  NegotiationWithWarningsResult,
} from './protocol-handshake.js';

// Capability Declaration
export {
  FeaturesSchema,
  CapabilityDeclarationSchema,
  parseCapabilityDeclaration,
  safeParseCapabilityDeclaration,
} from './capability-declaration.js';
export type {
  Features,
  CapabilityDeclaration,
} from './capability-declaration.js';

// Mode Setting
export {
  ModeSettingRequestSchema,
  ModeSettingResponseSchema,
  parseModeSettingRequest,
  safeParseModeSettingRequest,
  parseModeSettingResponse,
  safeParseModeSettingResponse,
} from './mode-setting.js';
export type {
  ModeSettingRequest,
  ModeSettingResponse,
} from './mode-setting.js';

// Tool Catalog
export {
  ToolCatalogEntrySchema,
  ModeRestrictionsSchema,
  ModeCatalogEntrySchema,
  ToolCatalogSchema,
  parseToolCatalogEntry,
  safeParseToolCatalogEntry,
  parseModeCatalogEntry,
  safeParseModeCatalogEntry,
  parseToolCatalog,
  safeParseToolCatalog,
} from './tool-catalog.js';
export type {
  ToolCatalogEntry,
  ModeRestrictions,
  ModeCatalogEntry,
  ToolCatalog,
} from './tool-catalog.js';

// Channel Registration
export {
  ChannelRegistrationSchema,
  ChannelDiscoverySchema,
  parseChannelRegistration,
  safeParseChannelRegistration,
  parseChannelDiscovery,
  safeParseChannelDiscovery,
} from './channel-registration.js';
export type {
  ChannelRegistration,
  ChannelDiscovery,
} from './channel-registration.js';
