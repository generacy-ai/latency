# Tasks: Define Runtime Binding Types

**Input**: Design documents from `/specs/005-define-runtime-binding-types/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Core Type Definitions

- [ ] T001 [P] Create `packages/latency/src/runtime/registry.ts` — Define `FacetRegistry` interface with `register<T>()`, `resolve<T>()`, `list()`, `has()`, `unregister()` methods, plus `RegistrationOptions` and `FacetRegistration` interfaces. Include JSDoc with `@module` tag and `@example` blocks following existing codebase conventions.
- [ ] T002 [P] Create `packages/latency/src/runtime/resolution.ts` — Define `FacetNotFoundError`, `AmbiguousFacetError`, `CircularDependencyError` concrete error classes extending `Error`, plus `BindingError` interface. Follow the pattern established by `FacetError` in `facets/common.ts`.
- [ ] T003 Create `packages/latency/src/runtime/binder.ts` — Define `Binder` interface with async `bind()` returning `Promise<BindingResult>`, plus `BinderConfig`, `ExplicitBinding`, and `BindingResult` interfaces. Import `PluginManifest` from `../composition/manifest.js`, `PluginContext` from `../composition/context.js`, `FacetRegistry` from `./registry.js`, and `BindingError` from `./resolution.js`.

## Phase 2: Barrel Exports & Integration

- [ ] T004 Create `packages/latency/src/runtime/index.ts` — Barrel file re-exporting all types from `registry.ts`, `binder.ts`, `resolution.ts`. Use `export type` for interfaces and `export` for concrete error classes (values).
- [ ] T005 Update `packages/latency/src/index.ts` — Add runtime re-exports alongside existing composition and facets exports. Error classes exported as values; interfaces as `export type`.

## Phase 3: Verification

- [ ] T006 Run `pnpm typecheck` to verify all types compile without errors
- [ ] T007 Run `pnpm build` to verify `.d.ts` files are generated for all runtime types and all types are importable from `@generacy-ai/latency`

## Dependencies & Execution Order

- **T001 and T002** can run in parallel (no shared dependencies)
- **T003** depends on T001 (imports `FacetRegistry`) and T002 (imports `BindingError`)
- **T004** depends on T001, T002, T003 (re-exports all)
- **T005** depends on T004 (re-exports runtime barrel)
- **T006** depends on T005 (needs all files in place)
- **T007** depends on T006 (typecheck before build)
