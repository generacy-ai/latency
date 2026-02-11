# Implementation Plan: Health Check Facet

**Branch**: `030-add-health-check-endpoint` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/030-add-health-check-endpoint/spec.md`

## Summary

Add a `HealthCheck` facet to the latency plugin framework following the existing facet-based architecture. The facet interface is defined in the core `latency` package, with a default plugin implementation in a new `latency-plugin-health-check` package. The plugin aggregates health contributors registered by other plugins and returns composite health status.

## Technical Context

**Language/Version**: TypeScript 5.x, ES modules
**Primary Dependencies**: `@generacy-ai/latency` (core framework)
**Storage**: N/A (in-memory only)
**Testing**: vitest
**Target Platform**: Node.js 20+
**Project Type**: Monorepo plugin package
**Performance Goals**: < 50ms for basic health check (no external calls)
**Constraints**: Must follow existing facet patterns (FacetRegistry, PluginContext, PluginManifest)

## Architecture

### Existing Patterns Used

1. **Facet definition** in `packages/latency/src/facets/` — pure interface, no implementation
2. **Plugin package** in `packages/latency-plugin-health-check/` — implements the facet
3. **PluginContext.provide()** to register the implementation
4. **PluginContext.require()** for Logger dependency
5. **FacetError** from `facets/common.ts` for error handling

### New Components

```
packages/latency/src/facets/health-check.ts     # Facet interface definition
packages/latency-plugin-health-check/            # Plugin implementation
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts                                 # Public exports
│   └── plugin.ts                                # HealthCheckPlugin class + activate()
└── __tests__/
    └── plugin.test.ts                           # Unit tests
```

## Design Decisions

### D1: Facet interface keeps it simple
The `HealthCheck` facet exposes two methods:
- `getHealth()` — returns aggregate status
- `registerContributor(name, fn)` — allows plugins to add their own checks

This matches the pattern of other facets (e.g., EventBus has subscribe/publish).

### D2: Status aggregation uses "worst wins"
If any contributor returns `unhealthy`, overall status is `unhealthy`. If any returns `degraded`, overall is `degraded`. Only if all are `healthy` is overall `healthy`.

### D3: Timeout per contributor
Each health contributor gets a configurable timeout (default 5s). If a check times out, it reports as `unhealthy` with a timeout error message.

### D4: No HTTP layer in this phase
The spec mentions an optional HTTP plugin (FR-004, P2). We defer this to keep the scope small. The facet interface is sufficient for programmatic health checks, and an HTTP adapter can be added later.

## Implementation Steps

### Step 1: Define HealthCheck facet interface
**File**: `packages/latency/src/facets/health-check.ts`

Define the `HealthCheck` interface, `HealthStatus` type, `HealthCheckResult` type, and `HealthContributor` type. Export from the facets barrel file.

**Depends on**: Nothing
**Estimated complexity**: Small

### Step 2: Export facet from core package
**File**: `packages/latency/src/facets/index.ts`

Add the health-check facet exports to the barrel file so consumers can import from `@generacy-ai/latency`.

**Depends on**: Step 1

### Step 3: Create latency-plugin-health-check package
**Files**: `packages/latency-plugin-health-check/package.json`, `tsconfig.json`, `vitest.config.ts`

Scaffold the new plugin package with proper dependencies on `@generacy-ai/latency`.

**Depends on**: Nothing (can parallel with Step 1)

### Step 4: Implement HealthCheckPlugin
**File**: `packages/latency-plugin-health-check/src/plugin.ts`

Implement the `HealthCheckPlugin` class:
- Constructor takes `PluginContext`, gets Logger
- `registerContributor()` stores checkers in a Map
- `getHealth()` runs all contributors with timeout, aggregates results
- `activate()` function registers the plugin via `ctx.provide()`

**Depends on**: Steps 1, 3

### Step 5: Write unit tests
**File**: `packages/latency-plugin-health-check/__tests__/plugin.test.ts`

Test:
- Basic health check with no contributors returns healthy
- Health check with healthy contributor returns healthy
- Health check with unhealthy contributor returns unhealthy
- Worst status wins aggregation
- Contributor timeout handling
- Version and uptime are populated

**Depends on**: Step 4

### Step 6: Add to pnpm workspace and verify build
Register the new package in the workspace, run `pnpm install`, `pnpm build`, and `pnpm test` to verify everything compiles and passes.

**Depends on**: Steps 1-5

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Circular dependency with core | Low | High | Facet is interface-only in core, no implementation |
| Timeout races | Medium | Low | Use Promise.race with AbortController |
| Breaking existing tests | Low | Medium | Facet is additive, no changes to existing code |

## Testing Strategy

- **Unit tests**: Test the HealthCheckPlugin in isolation with mocked PluginContext
- **Type checking**: `tsc --noEmit` across the monorepo to verify no type errors
- **Existing tests**: Run `pnpm test` at root to ensure nothing is broken

---

*Generated by speckit*
