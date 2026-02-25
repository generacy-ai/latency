# Data Model: Migrated Protocol Types

This document catalogs every type, schema, and utility being migrated from `@generacy-ai/contracts` into `@generacy-ai/latency`, organized by domain.

## Domain 1: `protocols/common/`

### Branded ID Types (`ids.ts`)

| Type | Pattern | Public Export |
|------|---------|:---:|
| `CorrelationId` | `string & { __brand: 'CorrelationId' }` | Yes |
| `RequestId` | `string & { __brand: 'RequestId' }` | Yes |
| `SessionId` | `string & { __brand: 'SessionId' }` | Yes |
| `OrganizationId` | `string & { __brand: 'OrganizationId' }` | No (in file, not in barrel) |
| `MembershipId` | `string & { __brand: 'MembershipId' }` | No |
| `InviteId` | `string & { __brand: 'InviteId' }` | No |
| `WorkItemId` | `string & { __brand: 'WorkItemId' }` | No |
| `AgentId` | `string & { __brand: 'AgentId' }` | No |

Each ID type has: `*Schema` (Zod with ULID validation + transform), `generate*()` function.
**Runtime dependency**: `ulid` (for generate functions).

### Timestamps (`timestamps.ts`)

| Export | Kind |
|--------|------|
| `ISOTimestamp` | Branded type (`string & { __brand: 'ISOTimestamp' }`) |
| `ISOTimestampSchema` | Zod schema (ISO 8601 datetime validation) |
| `createTimestamp()` | Utility → returns current time as `ISOTimestamp` |

### Pagination (`pagination.ts`)

| Export | Kind |
|--------|------|
| `PaginationParams` | Type (inferred from Zod) — `{ limit?: number; offset?: number }` |
| `PaginatedResponse<T>` | Generic type — `{ items: T[]; total: number; hasMore: boolean }` |
| `PaginationParamsSchema` | Zod schema |
| `PaginatedResponseSchema` | Zod generic factory `(itemSchema: ZodType) => ZodObject` |

### Errors (`errors.ts`)

| Export | Kind |
|--------|------|
| `ErrorCode` | Const object enum (e.g., `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, etc.) |
| `ErrorCodeSchema` | Zod enum schema |
| `ErrorResponse` | Type — `{ code: ErrorCode; message: string; details?: unknown }` |
| `ErrorResponseSchema` | Zod schema |
| `createErrorResponse()` | Factory function |

### Urgency (`urgency.ts`)

| Export | Kind | Root Export |
|--------|------|:---:|
| `Urgency` | Const object: `BLOCKING_NOW`, `BLOCKING_SOON`, `WHEN_AVAILABLE` | **No** (collides with facets) |
| `UrgencySchema` | Zod enum schema | **No** |

### Configuration (`config.ts`)

| Export | Kind |
|--------|------|
| `BaseConfig` | Type — extensible config object with `passthrough()` |
| `BaseConfigSchema` | Zod schema |

### Message Envelope (`message-envelope.ts`)

| Export | Kind |
|--------|------|
| `MessageMeta` | Type — `{ correlationId?, requestId?, timestamp?, source? }` |
| `MessageMetaSchema` | Zod schema |
| `MessageEnvelope<T>` | Generic type — `{ channel, type, payload: T, meta? }` |
| `MessageEnvelopeSchema` | Generic Zod factory `(payloadSchema) => ZodObject` |
| `BaseMessageEnvelopeSchema` | Non-generic version with `z.unknown()` payload |

### Version Utilities (`version.ts`)

| Export | Kind |
|--------|------|
| `SemVer` | Interface — `{ major, minor, patch, prerelease?, build? }` |
| `ParseVersionOptions` | Type |
| `parseVersion()` | Utility — string → SemVer |
| `compareVersions()` | Utility — (SemVer, SemVer) → -1/0/1 |
| `isVersionCompatible()` | Utility — checks compatibility |
| `SemVerStringSchema` | Zod schema (validates semver strings) |
| `VersionRangeSchema` | Zod schema (validates version ranges) |

### Capability System (`capability.ts`)

| Export | Kind |
|--------|------|
| `Capability` | Const object enum (e.g., `METRICS`, `TELEMETRY`, `DECISIONS`, etc.) |
| `CapabilitySchema` | Zod enum schema |
| `CapabilityString` | Type (string union from Capability values) |
| `CapabilityConfig` | Type — `{ version, deprecated?, deprecation? }` |
| `CapabilityConfigSchema` | Zod schema |
| `DeprecationInfo` | Type — `{ since, replacement?, message }` |
| `DeprecationInfoSchema` | Zod schema |
| `CapabilityMissingError` | Error class |
| `CapabilityResult` | Type |
| `CapabilityQuery` | Type |
| `createCapabilityQuery()` | Factory function |

### Extended Metadata (`extended-meta.ts`)

| Export | Kind |
|--------|------|
| `ExtendedMeta` | Type — plugin extensibility metadata |
| `ExtendedMetaSchema` | Zod schema |

---

## Domain 2: `protocols/orchestration/`

### Agent Info (`agent-info.ts`)

| Export | Kind |
|--------|------|
| `AgentStatus` | Const object: `AVAILABLE`, `BUSY`, `OFFLINE` |
| `AgentStatusSchema` | Zod enum |
| `AgentInfo` | Type — `{ id: AgentId, status, capabilities[], lastHeartbeat, metadata }` |
| `AgentInfoSchema` | Zod schema |
| `parseAgentInfo()` | Parse function |
| `safeParseAgentInfo()` | Safe parse function |

### Work Item (`work-item.ts`)

| Export | Kind |
|--------|------|
| `WorkItemType` | Const object enum |
| `WorkItemStatus` | Const object: `PENDING`, `CLAIMED`, `IN_PROGRESS`, `COMPLETED`, `FAILED` |
| `WorkItem` | Type — `{ id, type, priority, status, payload, assignedAgent?, createdAt, updatedAt }` |
| `WorkItemSchema` | Zod schema |
| `parseWorkItem()` / `safeParseWorkItem()` | Parse functions |

### Events (`events.ts`)

| Export | Kind |
|--------|------|
| `OrchestratorEventType` | Const object (10 event type strings) |
| `WorkQueuedEventSchema` | Zod schema |
| `WorkClaimedEventSchema` | Zod schema |
| `WorkCompletedEventSchema` | Zod schema |
| `WorkFailedEventSchema` | Zod schema |
| `WorkReassignedEventSchema` | Zod schema |
| `WorkProgressEventSchema` | Zod schema |
| `AgentRegisteredEventSchema` | Zod schema |
| `AgentHeartbeatEventSchema` | Zod schema |
| `AgentOfflineEventSchema` | Zod schema |
| `AgentDeregisteredEventSchema` | Zod schema |
| `OrchestratorEventSchema` | Discriminated union of all 10 |
| `OrchestratorEvent` | Type (inferred from union) |
| `parseOrchestratorEvent()` / `safeParseOrchestratorEvent()` | Parse functions |

### Status (`status.ts`)

| Export | Kind |
|--------|------|
| `OrchestratorStatus` | Type — `{ agents, workItems, uptime, version }` |
| `OrchestratorStatusSchema` | Zod schema |
| `parseOrchestratorStatus()` / `safeParseOrchestratorStatus()` | Parse functions |

---

## Domain 3: `protocols/agency-generacy/`

### Capability Declaration (`capability-declaration.ts`)
- `Features` / `FeaturesSchema` — boolean feature flags
- `CapabilityDeclaration` / `CapabilityDeclarationSchema` — component capability announcement
- Parse helpers

### Channel Registration (`channel-registration.ts`)
- `ChannelRegistration` / `ChannelRegistrationSchema`
- `ChannelDiscovery` / `ChannelDiscoverySchema`
- Parse helpers

### Mode Setting (`mode-setting.ts`)
- `ModeSettingRequest` / `ModeSettingRequestSchema`
- `ModeSettingResponse` / `ModeSettingResponseSchema`
- Parse helpers

### Protocol Handshake (`protocol-handshake.ts`)
- `Component` / `ComponentSchema`
- `ProtocolHandshake` / `ProtocolHandshakeSchema`
- `ProtocolHandshakeResponse` / `ProtocolHandshakeResponseSchema`
- `ProtocolNegotiationErrorDetails` / `ProtocolNegotiationErrorDetailsSchema`
- `ProtocolNegotiationError` / `ProtocolNegotiationErrorSchema`
- `ProtocolHandshakeResult` / `ProtocolHandshakeResultSchema`
- `negotiateProtocol()`, `negotiateWithWarnings()` — runtime protocol negotiation
- `NegotiateWithWarningsOptions`, `NegotiationWithWarningsResult`
- Parse helpers for all schemas

### Tool Catalog (`tool-catalog.ts`)
- `ToolCatalogEntry` / `ToolCatalogEntrySchema`
- `ModeRestrictions` / `ModeRestrictionsSchema`
- `ModeCatalogEntry` / `ModeCatalogEntrySchema`
- `ToolCatalog` / `ToolCatalogSchema`
- Parse helpers

---

## Domain 4: `protocols/agency-humancy/`

All types use the **versioned namespace pattern**:

### Decision Request (`decision-request.ts`)
- `DecisionOption` namespace (V1, Latest, VERSIONS, getVersion)
- `DecisionRequest` namespace (V1, Latest, VERSIONS, getVersion)
- `DecisionTypeSchema`, `UrgencyLevelSchema` (non-versioned enums)
- `DecisionType`, `UrgencyLevel` types
- Schema aliases: `DecisionOptionSchema`, `DecisionRequestSchema`
- Parse helpers

### Decision Response (`decision-response.ts`)
- `DecisionResponse` namespace (V1, Latest, VERSIONS, getVersion)
- Schema alias: `DecisionResponseSchema`
- Parse helpers

### Mode Management (`mode-management.ts`)
- `ModeDefinition` namespace
- `ModeChangeRequest` namespace
- Schema aliases + parse helpers

### Tool Invocation (`tool-invocation.ts`)
- `InvocationContext` namespace
- `ToolInvocation` namespace
- Schema aliases + parse helpers

### Tool Registration (`tool-registration.ts`)
- `ToolParameterSchema` namespace
- `ReturnSchema` namespace
- `ToolRegistration` namespace
- Schema aliases + parse helpers

### Tool Result (`tool-result.ts`)
- `ToolError` namespace
- `ToolResult` namespace
- Schema aliases + parse helpers

---

## Domain 5: `protocols/generacy-humancy/`

### Extended Decision Option (`decision-option.ts`)
- `ExtendedDecisionOption` / `ExtendedDecisionOptionSchema` — extends agency-humancy DecisionOption with `value`, `recommended` fields

### Decision Queue Item (`decision-queue-item.ts`)
- `DecisionQueueItem` / `DecisionQueueItemSchema` — queued decision with urgency and timestamps

### Integration Status (`integration-status.ts`)
- `IntegrationStatusType` const enum: `CONNECTED`, `DISCONNECTED`, `DEGRADED`, `INITIALIZING`
- `IntegrationStatus` / `IntegrationStatusSchema`

### Notification (`notification.ts`)
- `NotificationType` const enum
- `NotificationUrgency` const enum
- `Notification` / `NotificationSchema`

### Queue Status (`queue-status.ts`)
- `QueueStatus` / `QueueStatusSchema` — aggregated queue counts and timing

### Workflow Event (`workflow-event.ts`)
- `WorkflowEventType` const enum
- `WorkflowEvent` / `WorkflowEventSchema`

---

## Domain 6: `protocols/telemetry/`

### Error Category (`error-category.ts`)
- `ErrorCategory` const enum: `VALIDATION`, `TIMEOUT`, `PERMISSION`, `NETWORK`, `INTERNAL`, `UNKNOWN`
- `ErrorCategorySchema`

### Time Window (`time-window.ts`)
- `TimeWindow` const enum: `LAST_24H`, `LAST_7D`, `LAST_30D`, `ALL_TIME`
- `TimeWindowSchema`

### Tool Call Event (`tool-call-event.ts`)
- `EventId` branded type + `EventIdSchema` + `generateEventId()`
- `ToolCallEvent` / `ToolCallEventSchema` — full-detail telemetry event with session, workflow context

### Anonymous Tool Metric (`anonymous-tool-metric.ts`)
- `AnonymousToolMetric` / `AnonymousToolMetricSchema` — privacy-preserving metric (no PII)

### Tool Stats (`tool-stats.ts`)
- `ToolStats` / `ToolStatsSchema` — aggregated statistics with percentiles

---

## Domain 7: `protocols/version-compatibility/`

### Capability Registry (`capability-registry.ts`)
- `CAPABILITY_CONFIG` — Map of Capability → CapabilityConfig
- `CAPABILITY_DEPS` — Map of Capability → Capability[] dependencies
- `DependencyValidationResult` type
- `validateCapabilityDependencies()`, `getCapabilityConfig()`, `isCapabilityDeprecated()`, `getDeprecationInfo()`, `getAllDependencies()`

### Versioned Schemas (`versioned-schemas.ts`)
- `VersionedSchemaConfig` type
- `SchemaVersionMap` type
- `createVersionedSchema()` — factory for creating versioned schema collections
- `getSchemaForVersion()` — runtime version lookup
- `VersionedDecisionRequest` — example implementation

### Deprecation Warnings (`deprecation-warnings.ts`)
- `DeprecationWarning` type + `DeprecationWarningSchema`
- `collectDeprecationWarnings()`, `formatDeprecationMessage()`, `formatDeprecationMessages()`, `hasDeprecatedCapabilities()`, `getDeprecationReplacements()`

---

## Cross-Domain Dependency Graph

```
common ─────────────────────────────────┐
  │                                      │
  ├── orchestration (uses IDs, timestamps, capabilities)
  │                                      │
  ├── agency-generacy (uses version utils, capabilities)
  │                                      │
  ├── agency-humancy (uses ExtendedMeta, IDs, timestamps)
  │     │                                │
  │     └── generacy-humancy (uses DecisionOption from agency-humancy)
  │                                      │
  ├── telemetry (uses IDs, timestamps)   │
  │                                      │
  └── version-compatibility (uses Capability, CapabilityConfig, DeprecationInfo)
```

All inter-domain dependencies flow through `common/` or from `agency-humancy/` → `generacy-humancy/`. No circular dependencies exist.
