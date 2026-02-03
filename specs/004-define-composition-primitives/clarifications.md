# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 04:40

### Q1: Source directory path
**Context**: The spec file structure shows `packages/latency/src/` but the repo root is `/workspaces/latency/` with no `packages/` directory or existing `src/`. The correct path determines where all composition files are created.
**Question**: Should the composition files be created at `src/composition/` relative to the repo root (i.e., `/workspaces/latency/src/composition/`)?
**Options**:
- A: Yes, create at `src/composition/` relative to repo root
- B: Create under a different path (please specify)

**Answer**: *Pending*

### Q2: Undefined supporting types
**Context**: PluginContext references `DecisionRequest`, `DecisionResult`, `Logger`, and `StateStore` — none of which are defined in the spec or existing codebase. These are needed for the PluginContext interface to compile.
**Question**: Should this issue define stub/placeholder interfaces for DecisionRequest, DecisionResult, Logger, and StateStore, or should PluginContext only reference them as imported types (leaving actual definitions to a future issue)?
**Options**:
- A: Define minimal stub interfaces in this issue (e.g., in facet.ts or a separate types.ts)
- B: Use type-only references and leave definitions to future issues
- C: Remove DecisionRequest/Logger/StateStore from PluginContext for now — add when those features are built

**Answer**: *Pending*

### Q3: facet.ts contents
**Context**: The task list includes creating `src/composition/facet.ts` for 'FacetDeclaration/Requirement types', but the Core Types section only defines types in manifest.ts and context.ts. It's unclear what additional types belong in facet.ts vs what's already in manifest.ts (which has FacetProvider and FacetRequirement).
**Question**: What types should facet.ts contain that aren't already defined in manifest.ts? Should FacetProvider and FacetRequirement be moved from manifest.ts to facet.ts and re-exported?
**Options**:
- A: Move FacetProvider/FacetRequirement to facet.ts, add FacetDeclaration and any helper types there
- B: Keep manifest.ts as-is, use facet.ts for additional helper types like FacetDeclaration, FacetRegistry, etc.
- C: Remove facet.ts — the manifest.ts types are sufficient for this issue

**Answer**: *Pending*

### Q4: Unit tests scope
**Context**: The task list only includes creating source files (manifest.ts, context.ts, facet.ts, index.ts) with no mention of tests. Since these are pure type definitions, tests may be limited, but validation functions or type guards could be tested.
**Question**: Should this issue include unit tests for the composition types, or are tests deferred to when runtime implementations are built?
**Options**:
- A: Include basic tests (type validation, manifest structure checks)
- B: Defer tests to the implementation issue — types-only doesn't need tests

**Answer**: *Pending*

### Q5: Root index.ts exports
**Context**: The file structure shows a root `src/index.ts` that presumably re-exports composition types for package consumers. There's no task to create or update this file.
**Question**: Should a root `src/index.ts` be created that re-exports from `composition/index.ts` to make types available as package exports?
**Options**:
- A: Yes, create src/index.ts that re-exports composition types
- B: No, consumers will import directly from src/composition/

**Answer**: *Pending*

