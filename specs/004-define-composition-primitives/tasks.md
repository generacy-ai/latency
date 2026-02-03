# Tasks: Define Composition Primitives

**Input**: Design documents from `/specs/004-define-composition-primitives/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup

- [ ] T001 Create composition directory structure at `packages/latency/src/composition/`

## Phase 2: Core Type Definitions

- [ ] T010 [P] Create `packages/latency/src/composition/facet.ts` — Define `FacetProvider`, `FacetRequirement`, and `FacetDeclaration` interfaces with JSDoc documentation
- [ ] T020 [P] Create `packages/latency/src/composition/manifest.ts` — Define `PluginManifest` interface importing from `facet.ts`, with JSDoc documentation
- [ ] T030 Create `packages/latency/src/composition/context.ts` — Define `PluginContext`, `DecisionRequest`, `DecisionResult`, `Logger`, and `StateStore` interfaces importing from `manifest.ts`, with JSDoc documentation

## Phase 3: Barrel Exports & Integration

- [ ] T040 Create `packages/latency/src/composition/index.ts` — Barrel re-exports of all composition types
- [ ] T050 Update `packages/latency/src/index.ts` — Re-export composition module for package-level imports

## Phase 4: Validation

- [ ] T060 Run `pnpm build` and `pnpm typecheck` to verify compilation succeeds
- [ ] T070 Run `pnpm lint` and fix any linting issues

## Dependencies & Execution Order

1. **T001** must complete first (directory structure)
2. **T010** and **T020** can run in parallel (both are leaf files with no cross-dependencies)
3. **T030** depends on T020 (imports `PluginManifest` from manifest.ts)
4. **T040** depends on T010, T020, T030 (re-exports all types)
5. **T050** depends on T040 (re-exports composition barrel)
6. **T060** and **T070** depend on all prior tasks

**Parallel opportunities**: T010 + T020 can be written simultaneously. T060 + T070 can potentially overlap if lint is run during build.
