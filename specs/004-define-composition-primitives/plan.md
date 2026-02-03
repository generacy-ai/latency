# Implementation Plan: Define Composition Primitives

**Feature**: Composition system for plugin facet declaration and dependency management
**Branch**: `004-define-composition-primitives`
**Status**: Complete

## Summary

Create the type-level composition system that allows plugins to declare what facets they provide and require. This includes plugin manifests, facet declarations, and the runtime context interface. All artifacts are TypeScript interfaces/types with JSDoc documentation — no runtime logic.

## Technical Context

- **Language**: TypeScript 5.4+ (strict mode, ES2022 target)
- **Module System**: ESM (`"type": "module"`, NodeNext resolution)
- **Package**: `@generacy-ai/latency` (pnpm monorepo under `packages/latency/`)
- **Build**: `tsc` direct compilation, output to `dist/`
- **Linting**: ESLint with TypeScript strict type-checking, Prettier
- **Testing**: Vitest (deferred — types-only issue)

## Project Structure

```
packages/latency/src/
├── composition/
│   ├── facet.ts              # FacetProvider, FacetRequirement, FacetDeclaration
│   ├── manifest.ts           # PluginManifest (imports from facet.ts)
│   ├── context.ts            # PluginContext, supporting types (Logger, StateStore, etc.)
│   ├── index.ts              # Barrel re-exports
└── index.ts                  # Updated: re-exports composition types
```

## Implementation Approach

### File: `src/composition/facet.ts`

The foundational facet types. These are referenced by both manifest and context.

**Types defined**:
- `FacetProvider` — declares a facet implementation with optional qualifier and priority
- `FacetRequirement` — declares a facet dependency with optional qualifier and optional flag
- `FacetDeclaration` — union type combining provider/requirement metadata for registry use

**Rationale**: Separating facet types into their own module avoids circular dependencies. Both `manifest.ts` and `context.ts` depend on facet concepts, so facet.ts is the leaf dependency.

### File: `src/composition/manifest.ts`

The plugin manifest interface — a declarative contract between plugins and the runtime.

**Types defined**:
- `PluginManifest` — core manifest with `id`, `version`, `name`, `provides[]`, `requires[]`, `uses[]?`

**Imports from**: `facet.ts` (FacetProvider, FacetRequirement)

### File: `src/composition/context.ts`

The runtime context interface and its supporting types.

**Types defined**:
- `PluginContext` — runtime interface for facet access, decision requests, logging, and state
- `DecisionRequest` — minimal stub for human decision routing
- `DecisionResult` — minimal stub for decision outcomes
- `Logger` — minimal logging interface (debug/info/warn/error)
- `StateStore` — minimal key-value state interface

**Imports from**: `manifest.ts` (PluginManifest)

**Rationale for stubs**: The supporting types (`Logger`, `StateStore`, `DecisionRequest`, `DecisionResult`) are defined as minimal interfaces here rather than left undefined. This ensures PluginContext compiles and is usable immediately. Future issues will expand these interfaces as runtime implementations are built.

### File: `src/composition/index.ts`

Barrel export that re-exports all public types from the composition module.

### File: `src/index.ts` (update existing)

Update the existing placeholder to re-export from `composition/index.ts`, making types available as package-level imports.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Facet types location | Separate `facet.ts` | Avoids circular deps; leaf dependency for manifest and context |
| Supporting type stubs | Defined in `context.ts` | Enables immediate compilation; minimal surface area |
| Test inclusion | Deferred | Types-only; no runtime logic to test |
| Export strategy | Barrel re-exports at both composition and package level | Standard monorepo pattern; clean import paths |

## Dependencies

- No new dependencies required
- All types are pure TypeScript interfaces (no runtime imports)

## Validation

- `pnpm build` must succeed (tsc compilation)
- `pnpm typecheck` must pass
- `pnpm lint` must pass
- All acceptance criteria from spec must be met

## Risks

- **Supporting type stubs may need revision**: The minimal Logger/StateStore/DecisionRequest interfaces are placeholders. Future issues defining these fully may require breaking changes. Mitigation: keep stubs as narrow as possible.
- **facet.ts scope**: The FacetDeclaration type is speculative — if not needed by other issues, it can be removed. Keep it minimal.
