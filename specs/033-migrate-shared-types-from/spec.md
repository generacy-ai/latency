# Feature Specification: Migrate shared types from contracts repo

**Branch**: `033-migrate-shared-types-from` | **Date**: 2026-02-25 | **Status**: Draft

## Summary

Migrate shared type definitions, Zod schemas, and cross-component communication types from `@generacy-ai/contracts` into `@generacy-ai/latency`. Latency is the shared foundation layer for the Tetrad ecosystem, making it the proper home for cross-component types. This is a "move types to their proper home" migration — no active repo currently depends on `@generacy-ai/contracts`, so there is no live dependency swap required.

## Parent Epic

Replaces cross-repo issue generacy-ai/generacy#246. Agency has a separate issue for tool schemas migration (excluded from this spec).

## Description

The `@generacy-ai/contracts` repo contains ~1,152 exports across 209 TypeScript files, including shared type definitions, Zod validation schemas, branded ID types, and cross-component communication contracts. These types define the shared language used across all Tetrad components (Agency, Generacy, Humancy).

Latency already serves as the foundation layer — it defines core facet interfaces (`IssueTracker`, `SourceControl`, `EventBus`, etc.) and the plugin composition system. Cross-component types logically belong here rather than in a separate contracts package.

### What changes

1. **New dependency**: Add `zod` to `@generacy-ai/latency` (contracts types use Zod schemas for runtime validation)
2. **New source directories**: Add domain-organized directories under `packages/latency/src/` for the migrated types
3. **New exports**: All migrated types, schemas, and utility functions exported from the package root
4. **New tests**: Migrate and adapt existing contract tests to latency's vitest conventions

### Key architectural consideration

Latency is currently a pure-types package with zero runtime dependencies. Adding Zod introduces the first runtime dependency. This is acceptable because:
- Zod schemas provide runtime validation that downstream consumers already rely on
- The types and their validation schemas are inseparable — splitting them would force consumers to depend on both packages
- Zod is a zero-dependency library itself, keeping the dependency tree minimal

## User Stories

### US1: Component developer consuming shared types

**As a** Tetrad component developer (Agency, Generacy, or Humancy),
**I want** all shared types, schemas, and cross-component communication contracts available from `@generacy-ai/latency`,
**So that** I have a single dependency for all foundation-layer types instead of depending on a separate contracts package.

**Acceptance Criteria**:
- [ ] All common types (IDs, errors, pagination, timestamps, etc.) importable from `@generacy-ai/latency`
- [ ] All cross-component communication types (agency-generacy, agency-humancy, generacy-humancy) importable from `@generacy-ai/latency`
- [ ] Zod schemas available alongside types for runtime validation
- [ ] TypeScript IntelliSense and type inference work correctly for all migrated types

### US2: Developer validating cross-component messages

**As a** developer building inter-component communication,
**I want** Zod schemas co-located with their type definitions,
**So that** I can validate messages at component boundaries using the same package that defines the types.

**Acceptance Criteria**:
- [ ] Every migrated type that had a Zod schema in contracts still has its schema in latency
- [ ] Parse/safeParse helper functions migrated alongside schemas
- [ ] Branded ID types (CorrelationId, RequestId, etc.) with their ULID validation preserved

### US3: Developer working with versioned schemas

**As a** developer consuming schemas that evolve over time,
**I want** versioned schema support preserved in the migration,
**So that** I can work with specific schema versions and handle backward compatibility.

**Acceptance Criteria**:
- [ ] Versioned schema namespaces (e.g., `DecisionOption.V1`, `DecisionOption.Latest`) preserved
- [ ] Version compatibility utilities (`createVersionedSchema`, `validateCapabilityDependencies`) migrated
- [ ] Deprecation warning collection and formatting preserved

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Migrate `src/common/` types: capability, config, errors, ids, message-envelope, pagination, timestamps, urgency, version, extended-meta | P1 | Core domain models used by all components |
| FR-002 | Migrate `src/orchestration/` types: agent-info, events, status, work-item | P1 | Latency already owns orchestration abstractions |
| FR-003 | Migrate `src/agency-generacy/` types: capability-declaration, channel-registration, mode-setting, protocol-handshake, tool-catalog | P1 | Cross-component communication contracts |
| FR-004 | Migrate `src/agency-humancy/` types: decision-request, decision-response, mode-management, tool-invocation, tool-registration, tool-result | P1 | Cross-component communication contracts |
| FR-005 | Migrate `src/generacy-humancy/` types: decision-option, decision-queue-item, integration-status, notification, queue-status, workflow-event | P1 | Cross-component communication contracts |
| FR-006 | Migrate `src/telemetry/` types: anonymous-tool-metric, error-category, time-window, tool-call-event, tool-stats | P1 | Telemetry contracts |
| FR-007 | Migrate `src/version-compatibility/` types: capability-registry, versioned-schemas, deprecation-warnings | P1 | Version management utilities |
| FR-008 | Add `zod` as a runtime dependency to `@generacy-ai/latency` | P1 | Required for schema validation |
| FR-009 | Migrate all Zod schemas alongside their type definitions | P1 | Schemas and types are inseparable |
| FR-010 | Migrate parse/safeParse helper functions | P1 | Standard validation pattern used by consumers |
| FR-011 | Preserve branded ID types with ULID validation | P1 | CorrelationId, RequestId, SessionId, etc. |
| FR-012 | Preserve versioned schema namespace pattern | P2 | DecisionOption.V1/Latest/VERSIONS pattern |
| FR-013 | Migrate tests and adapt to latency's vitest conventions | P1 | `__tests__/*.test.ts` pattern at package root |
| FR-014 | Export all migrated types from package root (`src/index.ts`) | P1 | Single import path for consumers |
| FR-015 | Migrate schema generation scripts for telemetry types | P2 | JSON schema generation from Zod |
| FR-016 | Resolve type overlaps between existing latency types and contracts types | P1 | e.g., PaginatedQuery/PaginatedResult overlap |
| FR-017 | Add `ulid` as a runtime dependency for ID generation functions | P1 | Required by branded ID generators |

## Tasks

- [ ] Audit type overlaps between existing latency facets and contracts common types (PaginatedQuery, PaginatedResult, error types)
- [ ] Design directory structure under `packages/latency/src/` for migrated types (domain-based, following latency conventions)
- [ ] Add `zod` and `ulid` dependencies to `packages/latency/package.json`
- [ ] Migrate `common/` types (ids, errors, config, pagination, timestamps, urgency, version, capability, message-envelope, extended-meta)
- [ ] Reconcile overlapping types (latency's PaginatedQuery vs contracts' PaginationParams, error patterns)
- [ ] Migrate `orchestration/` types (agent-info, events, status, work-item)
- [ ] Migrate `agency-generacy/` types (protocol-handshake, capability-declaration, channel-registration, mode-setting, tool-catalog)
- [ ] Migrate `agency-humancy/` types (decision-request, decision-response, tool-invocation, tool-registration, tool-result, mode-management)
- [ ] Migrate `generacy-humancy/` types (decision-option, decision-queue-item, integration-status, notification, queue-status, workflow-event)
- [ ] Migrate `telemetry/` types (tool-call-event, anonymous-tool-metric, tool-stats, error-category, time-window)
- [ ] Migrate `version-compatibility/` types (capability-registry, versioned-schemas, deprecation-warnings)
- [ ] Create barrel exports (index.ts files) for each migrated domain directory
- [ ] Update `packages/latency/src/index.ts` to export all migrated types
- [ ] Migrate and adapt tests to `__tests__/*.test.ts` convention
- [ ] Migrate relevant schema generation scripts to `packages/latency/scripts/`
- [ ] Update `package.json` test script (replace "No tests yet" with vitest)
- [ ] Add `vitest.config.ts` to core latency package
- [ ] Verify all types compile, tests pass, and exports are accessible

## File Structure

```
packages/latency/
├── src/
│   ├── index.ts                         # Updated: add exports for all migrated types
│   ├── composition/                     # Existing (unchanged)
│   ├── facets/                          # Existing (unchanged)
│   ├── runtime/                         # Existing (unchanged)
│   ├── common/                          # NEW: migrated from contracts
│   │   ├── ids.ts                       # Branded ID types (CorrelationId, RequestId, etc.) + ULID generators
│   │   ├── errors.ts                    # ErrorCode enum, ErrorResponse schema
│   │   ├── config.ts                    # BaseConfig schema
│   │   ├── pagination.ts               # PaginationParams, PaginatedResponse schemas
│   │   ├── timestamps.ts               # ISO 8601 timestamp schemas
│   │   ├── capability.ts               # Capability enum, CapabilityConfig, CapabilityQuery
│   │   ├── urgency.ts                  # Urgency enum
│   │   ├── version.ts                  # SemVer, parseVersion, compareVersions
│   │   ├── message-envelope.ts         # MessageEnvelope<T>, MessageMeta
│   │   ├── extended-meta.ts            # ExtendedMeta schema
│   │   └── index.ts                    # Barrel export
│   ├── orchestration/                   # NEW: migrated from contracts
│   │   ├── agent-info.ts
│   │   ├── events.ts
│   │   ├── status.ts
│   │   ├── work-item.ts
│   │   └── index.ts
│   ├── protocols/                       # NEW: cross-component communication types
│   │   ├── agency-generacy/
│   │   │   ├── capability-declaration.ts
│   │   │   ├── channel-registration.ts
│   │   │   ├── mode-setting.ts
│   │   │   ├── protocol-handshake.ts
│   │   │   ├── tool-catalog.ts
│   │   │   └── index.ts
│   │   ├── agency-humancy/
│   │   │   ├── decision-request.ts
│   │   │   ├── decision-response.ts
│   │   │   ├── mode-management.ts
│   │   │   ├── tool-invocation.ts
│   │   │   ├── tool-registration.ts
│   │   │   ├── tool-result.ts
│   │   │   └── index.ts
│   │   ├── generacy-humancy/
│   │   │   ├── decision-option.ts
│   │   │   ├── decision-queue-item.ts
│   │   │   ├── integration-status.ts
│   │   │   ├── notification.ts
│   │   │   ├── queue-status.ts
│   │   │   ├── workflow-event.ts
│   │   │   └── index.ts
│   │   └── index.ts                    # Re-exports all protocol subdirectories
│   ├── telemetry/                       # NEW: migrated from contracts
│   │   ├── anonymous-tool-metric.ts
│   │   ├── error-category.ts
│   │   ├── time-window.ts
│   │   ├── tool-call-event.ts
│   │   ├── tool-stats.ts
│   │   └── index.ts
│   └── version-compatibility/           # NEW: migrated from contracts
│       ├── capability-registry.ts
│       ├── versioned-schemas.ts
│       ├── deprecation-warnings.ts
│       └── index.ts
├── __tests__/                           # NEW: migrated and adapted tests
│   ├── common/
│   │   ├── ids.test.ts
│   │   ├── errors.test.ts
│   │   ├── version.test.ts
│   │   └── ...
│   ├── orchestration/
│   │   └── ...
│   ├── protocols/
│   │   ├── agency-generacy/
│   │   ├── agency-humancy/
│   │   └── generacy-humancy/
│   ├── telemetry/
│   │   └── ...
│   └── version-compatibility/
│       └── ...
├── scripts/                             # NEW: migrated schema generation
│   └── generate-json-schemas.ts
├── vitest.config.ts                     # NEW
├── tsconfig.json                        # Updated: include new directories
└── package.json                         # Updated: add zod, ulid deps; update test script
```

## Type Overlap Resolution

The following types exist in both latency (facets/common.ts) and contracts and must be reconciled:

| Latency Type | Contracts Type | Resolution |
|-------------|---------------|------------|
| `PaginatedQuery` (`{ limit?, offset? }`) | `PaginationParams` (Zod schema with `page`, `pageSize`, `cursor?`) | Keep both — different pagination models. Latency's is for facet interfaces, contracts' is for API-level pagination. |
| `PaginatedResult<T>` (`{ items, total, hasMore }`) | `PaginatedResponse<T>` (Zod schema with `data`, `pagination`) | Keep both — different response shapes for different layers. |
| `FacetError` (class) | `ErrorResponse` (Zod schema with `ErrorCode` enum) | Keep both — FacetError is for facet runtime errors, ErrorResponse is for cross-component error serialization. |

## Acceptance Criteria

- [ ] All 7 type domains migrated from contracts into latency (common, orchestration, agency-generacy, agency-humancy, generacy-humancy, telemetry, version-compatibility)
- [ ] Zod schemas and parse/safeParse helpers migrated alongside every type that had them
- [ ] Branded ID types preserved with ULID validation and generator functions
- [ ] Versioned schema namespace pattern preserved (V1/Latest/VERSIONS)
- [ ] All migrated types exported from `@generacy-ai/latency` package root
- [ ] Existing latency types and exports unchanged (no breaking changes to current consumers)
- [ ] Tests pass for all migrated types (`pnpm test` in latency package)
- [ ] TypeScript compilation succeeds (`pnpm typecheck`)
- [ ] No circular dependency issues between migrated modules and existing latency modules

## Design Principles

1. **Domain organization over source mirroring** — Organize by domain following latency's conventions, not by replicating contracts' directory structure. Cross-component protocols are grouped under `protocols/` rather than as top-level directories.
2. **Co-locate schemas with types** — Zod schemas live in the same file as their TypeScript types, not in separate schema directories.
3. **Preserve public API** — All type names, schema names, and utility function signatures remain identical to contracts. Consumers updating their import path from `@generacy-ai/contracts` to `@generacy-ai/latency` should only need to change the package name.
4. **No breaking changes to existing latency** — Existing facet types, composition types, and runtime types remain unchanged. New types are additive only.
5. **Barrel exports for discoverability** — Each domain directory has an `index.ts` that re-exports all public types and schemas, following latency's established pattern.
6. **Adapt tests to local conventions** — Tests use `__tests__/*.test.ts` pattern with latency's vitest configuration, not contracts' in-source test pattern.

## References

- [Contracts repo](/workspaces/contracts) — Source of types being migrated
- [latency-architecture.md](/workspaces/tetrad-development/docs/latency-architecture.md) — Latency architecture documentation
- generacy-ai/generacy#246 — Original cross-repo issue (replaced by this)

## Assumptions

- The contracts repo at `/workspaces/contracts` is accessible and contains the current source of truth for all types
- No active repo currently depends on `@generacy-ai/contracts` as a published package (humancy's `file:` dep is deferred)
- Latency's existing consumers are unaffected — new exports are additive, existing exports unchanged
- Agency's tool schemas migration is handled separately and is out of scope here
- The `src/schemas/` directory in contracts (additional domain-specific schemas beyond the 7 directories listed) is NOT part of this migration
- The `src/generated/` directory in contracts will be regenerated from migrated scripts, not copied
- Adding `zod` and `ulid` as runtime dependencies to latency is acceptable

## Out of Scope

- **Tool schemas migration** — Agency has a separate issue for tool-specific schemas from `contracts/src/schemas/`
- **Deprecating or archiving the contracts repo** — That is a follow-up task after all migrations complete
- **Updating downstream consumers** — Changing import paths in Agency, Generacy, or Humancy to use `@generacy-ai/latency` instead of `@generacy-ai/contracts`
- **Publishing a new version of `@generacy-ai/latency`** — Version bump and publish is a separate release task
- **Modifying type definitions** — This is a pure migration; refactoring, renaming, or redesigning types is not in scope
- **Adding new types** — Only types that exist in contracts today are migrated; no new types are created
- **Generated JSON schema files** — The `src/generated/` output files are not migrated; they can be regenerated from the migrated scripts

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | Type compilation | Zero errors | `pnpm typecheck` passes |
| SC-002 | Test pass rate | 100% | `pnpm test` in latency package — all migrated tests pass |
| SC-003 | Export completeness | All contracts public types available | Compare exports of `@generacy-ai/contracts` (for migrated domains) against `@generacy-ai/latency` exports |
| SC-004 | No regressions | Existing tests unaffected | All pre-existing tests across the monorepo continue to pass |
| SC-005 | API compatibility | Import path swap only | Downstream consumer can switch from `@generacy-ai/contracts` to `@generacy-ai/latency` by changing only the import package name |

---

*Generated by speckit*
