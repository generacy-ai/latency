# Implementation Plan: Define Runtime Binding Types

**Feature**: Create runtime types for facet binding at startup
**Branch**: `005-define-runtime-binding-types`
**Status**: Complete

## Summary

Add the `src/runtime/` module to `@generacy-ai/latency` with interfaces and error types that define how cores (Agency, Generacy, Humancy) bind facets at startup. This is an interface-only module — no implementations, only contracts.

Four files will be created:
1. `registry.ts` — FacetRegistry interface for provider registration and discovery
2. `binder.ts` — Binder interface for resolving plugin dependencies
3. `resolution.ts` — Error classes for binding failures
4. `index.ts` — Barrel re-exports

The root `src/index.ts` will be updated to re-export all runtime types.

## Technical Context

- **Language**: TypeScript (strict mode, ES2022 target)
- **Module System**: ESM (`"type": "module"`, NodeNext resolution)
- **Build**: `tsc` (no bundler)
- **Dependencies**: None — pure type definitions + error classes
- **Existing Patterns**: Composition and facets modules follow identical structure

## Design Decisions

### Q1: Type overlap with composition module → Keep separate (Option B)
Runtime types are deliberately decoupled from composition types. `FacetRegistration` and `FacetProvider` have overlapping fields but serve different purposes: `FacetProvider` is a static declaration in a manifest; `FacetRegistration` is a runtime record in the registry. Keeping them separate avoids coupling the runtime layer to the composition layer and allows independent evolution.

### Q2: PluginContext reference → Import from composition (Option A)
`BindingResult.contexts` will import `PluginContext` from `composition/`. The Binder produces the same context type that plugins consume. This is a deliberate cross-module dependency — the runtime layer's job is to create the contexts defined by the composition layer.

### Q3: Sync vs async bind() → Make async (Option B)
`Binder.bind()` will return `Promise<BindingResult>`. The existing codebase is async-first (all facet methods return Promises). Async binding supports lazy-loading, async initialization, and future network-based discovery without breaking the contract.

### Q4: Error classes → Intentional concrete classes (Option A)
Error classes (`FacetNotFoundError`, `AmbiguousFacetError`, `CircularDependencyError`) are concrete implementations shared across all cores. This follows the pattern established by `FacetError` in `facets/common.ts` and ensures consistent error handling via `instanceof` checks.

## Project Structure

```
packages/latency/src/
├── runtime/
│   ├── registry.ts      # FacetRegistry, RegistrationOptions, FacetRegistration
│   ├── binder.ts         # Binder, BinderConfig, ExplicitBinding, BindingResult
│   ├── resolution.ts     # FacetNotFoundError, AmbiguousFacetError, CircularDependencyError, BindingError
│   └── index.ts          # Re-exports all runtime types
├── composition/          # (existing)
├── facets/               # (existing)
└── index.ts              # Updated to include runtime exports
```

## Implementation Details

### File: `src/runtime/registry.ts`

Defines the `FacetRegistry` interface — the core contract for provider registration and discovery.

Types:
- `FacetRegistry` — interface with methods: `register<T>()`, `resolve<T>()`, `list()`, `has()`, `unregister()`
- `RegistrationOptions` — qualifier, priority, metadata
- `FacetRegistration` — record of a registered provider (facet, qualifier, priority, metadata)

Notes:
- Generic `<T>` on register/resolve for type-safe provider access
- `resolve()` returns `T | undefined` (no throw on missing)
- All methods are synchronous — registry is an in-memory data structure

### File: `src/runtime/binder.ts`

Defines the `Binder` interface for resolving plugin dependencies against a registry.

Types:
- `Binder` — interface with `bind()` method returning `Promise<BindingResult>`
- `BinderConfig` — resolution strategy, explicit bindings, strict optional flag
- `ExplicitBinding` — manual binding for a specific plugin+facet pair
- `BindingResult` — success flag, contexts map, errors, warnings

Cross-module imports:
- `PluginManifest` from `../composition/manifest.js`
- `PluginContext` from `../composition/context.js`
- `FacetRegistry` from `./registry.js`
- `BindingError` from `./resolution.js`

### File: `src/runtime/resolution.ts`

Error classes for binding failures. Concrete implementations (not interfaces).

Classes:
- `FacetNotFoundError` — no provider for a facet (with optional qualifier)
- `AmbiguousFacetError` — multiple providers without explicit resolution
- `CircularDependencyError` — cycle in plugin dependency graph

Types:
- `BindingError` — associates an error with a specific plugin+facet combination

### File: `src/runtime/index.ts`

Barrel file re-exporting all types from the runtime module.

### File: `src/index.ts` (modification)

Add runtime re-exports alongside existing composition and facets exports. Error classes are exported as values (not just types) since they need to be instantiated.

## Conventions to Follow

Based on existing codebase patterns:

1. **JSDoc**: Module-level `@module` tags with `@example` blocks. Method-level docs with `{@link}` references between related types.
2. **Import paths**: Use `.js` extension in imports (NodeNext resolution)
3. **Export style**: Named exports, barrel re-exports via `index.ts`
4. **Type vs value exports**: Interfaces use `export type` in barrel files; classes use `export` (they're values)
5. **File naming**: Lowercase with hyphens (but existing files use single words — follow existing: `registry.ts`, `binder.ts`, `resolution.ts`)

## Verification

- `pnpm typecheck` passes with no errors
- `pnpm build` produces `.d.ts` files for all runtime types
- All types importable from `@generacy-ai/latency`
