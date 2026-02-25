# Research: Migrate Shared Types from Contracts

## Subpath Exports Implementation

### Node.js `exports` Field Behavior

The `exports` field in `package.json` is the standard mechanism for defining package entry points in Node.js 12.7+. When an `exports` field is present:

1. **It restricts what can be imported** — only declared subpaths are accessible
2. **Conditional exports** (`import`, `types`, `require`) control resolution per context
3. **TypeScript 4.7+** supports `exports` with `"moduleResolution": "NodeNext"` (which latency already uses)

### Compatibility with `tsc` Build Output

Since `tsc` preserves the source file structure 1:1 in `dist/`, each `src/protocols/domain/index.ts` compiles to `dist/protocols/domain/index.js` + `dist/protocols/domain/index.d.ts`. This maps directly to subpath exports:

```
"./protocols/common" → "dist/protocols/common/index.js"
```

No bundler or special build step needed. This is a natural fit.

### Backward Compatibility

The `main` and `types` top-level fields in `package.json` are fallbacks for tools that don't support `exports`. Keeping them alongside `exports` ensures maximum compatibility:

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./protocols/common": { ... }
  }
}
```

---

## Zod Runtime Dependency Analysis

### Current State
- Latency has **zero runtime dependencies** — it's a pure type definition package
- Adding `zod` and `ulid` changes latency from type-only to type+runtime

### Impact Assessment
- **zod@3.23.8**: ~57KB minified. Well-established, zero dependencies itself. Used across the ecosystem.
- **ulid@3.0.2**: ~2KB minified. Single function, zero dependencies. Only used in `ids.ts` for ID generation.
- Both are already in the workspace's dependency tree via other packages.

### Justification
The contracts types use Zod schemas for **runtime validation**, not just compile-time types. Migrating Zod schemas alongside their types is essential — consumers rely on `parse()`, `safeParse()`, and schema composition. Stripping Zod would make the migration incomplete and break the public API.

---

## Versioned Namespace Pattern

Contracts uses a specific pattern for forward-compatible schema evolution:

```typescript
export namespace DecisionRequest {
  export const V1 = z.object({ ... });
  export const Latest = V1;
  export const VERSIONS = { v1: V1 } as const;
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

// Convenience aliases
export const DecisionRequestSchema = DecisionRequest.Latest;
export type DecisionRequest = z.infer<typeof DecisionRequest.Latest>;
```

This pattern allows:
- **Explicit version access**: `DecisionRequest.V1`
- **Latest alias**: `DecisionRequestSchema` always points to the newest version
- **Runtime version negotiation**: `DecisionRequest.getVersion('v1')`

**Migration note**: This pattern uses TypeScript namespaces (which merge with types), relying on declaration merging. It compiles cleanly with `tsc` under `strict` mode.

---

## Import Path Adaptation Strategy

### Contracts' Internal Import Pattern
All contracts source files use relative imports with `.js` extensions:
```typescript
// In contracts/src/orchestration/events.ts
import { WorkItemSchema } from './work-item.js';
import { AgentInfoSchema } from './agent-info.js';
import { ISOTimestampSchema } from '../common/timestamps.js';
```

### After Migration (in latency)
The same relative paths work because the directory structure is preserved:
```
contracts/src/orchestration/events.ts    →  latency/src/protocols/orchestration/events.ts
contracts/src/common/timestamps.ts       →  latency/src/protocols/common/timestamps.ts
```

The relative path `../common/timestamps.js` works identically in both locations.

### Test Import Adaptation
Test imports need the most change:
```typescript
// Before (contracts): src/common/__tests__/ids.test.ts
import { ... } from '../ids.js';

// After (latency): __tests__/protocols/common/ids.test.ts
import { ... } from '../../../src/protocols/common/ids.js';
```

---

## Export Collision Inventory

### Full Collision Analysis

Checked every export name from the 7 migrated domains against every export name in latency's current `src/index.ts`:

| Contracts Export | Domain | Latency Existing Export | Location | Collision Type |
|---|---|---|---|---|
| `Urgency` | common | `Urgency` | facets/decision.ts | **Value conflict** — different enum values |
| `DecisionRequest` | agency-humancy | `DecisionRequest` | composition/context.ts | **Type conflict** — interface vs namespace+type |
| `DecisionOption` | agency-humancy | `DecisionOption` | facets/decision.ts | **Type conflict** — interface vs namespace+type |
| `PaginationParams` | common | `PaginatedQuery` | facets/common.ts | **Semantic overlap** — similar purpose, different shape |
| `PaginatedResponse` | common | `PaginatedResult` | facets/common.ts | **Semantic overlap** — similar purpose, different shape |
| `Logger` | — | `Logger` | composition/context.ts, facets/logging.ts | **Not migrated** — Logger is not in any migrated domain |

All other exports (~150+ names) have **no collision** with existing latency exports.

### Safe-to-Root-Export Categories
Based on collision analysis, these entire categories are safe to re-export from root:
- **IDs**: `CorrelationId`, `RequestId`, `SessionId` + schemas + generators
- **Timestamps**: `ISOTimestamp`, `ISOTimestampSchema`, `createTimestamp`
- **Errors**: `ErrorCode`, `ErrorResponse`, `ErrorCodeSchema`, `ErrorResponseSchema`, `createErrorResponse`
- **Config**: `BaseConfig`, `BaseConfigSchema`
- **Message Envelope**: `MessageMeta`, `MessageEnvelope`, schemas
- **Version**: `SemVer`, `parseVersion`, `compareVersions`, `isVersionCompatible`, schemas
- **Capability**: `Capability`, `CapabilitySchema`, `CapabilityConfig`, etc.
- **Extended Meta**: `ExtendedMeta`, `ExtendedMetaSchema`
- **Telemetry** (all): `ErrorCategory`, `TimeWindow`, `ToolCallEvent`, `AnonymousToolMetric`, `ToolStats` + schemas

---

## Test Migration Scope

### Tests Available per Domain

| Domain | Test Files | Test Count (approx) |
|---|---|---|
| common | 5 (ids, errors, pagination, message-envelope, version) | ~30 |
| orchestration | 4 (agent-info, events, status, work-item) | ~40 |
| agency-generacy | 5 (all source files) | ~35 |
| agency-humancy | 0 (tests are in schemas/ — out of scope) | 0 |
| generacy-humancy | 6 (all source files) | ~35 |
| telemetry | 5 (all source files) | ~25 |
| version-compatibility | 5 (incl. compatibility-matrix, capability) | ~35 |
| **Total** | **30** | **~200** |

### Agency-Humancy Test Gap
The `agency-humancy/` domain has no co-located tests in contracts. Its tests live in `schemas/decision-model/__tests__/` and `schemas/__tests__/tool-result.test.ts`, which are part of the excluded `schemas/` directory. Options:
1. **Accept the gap** — these are well-typed Zod schemas that are structurally validated by the type system
2. **Write basic smoke tests** — create minimal tests that parse valid/invalid data for each schema
3. **Defer** — address in a follow-up when schemas/ is migrated

Recommendation: Option 2 — write ~15 basic smoke tests for the 6 agency-humancy files during migration.
