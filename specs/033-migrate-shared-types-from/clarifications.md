# Clarification Questions

## Status: Resolved

## Questions

### Q1: Export Name Collisions
**Context**: Contracts re-exports everything from a flat namespace via `src/index.ts` (including all `schemas/*` subdomains). Several type names are reused across domains — e.g., `DecisionRequest` exists in both `agency-humancy/` and `schemas/decision-model/`, and `DecisionResult` exists in both latency's `composition/context.ts` and `facets/decision.ts`. The spec says "Preserve public API" and names should stay identical, but flat re-export from latency's index.ts will cause TypeScript name collisions.
**Question**: How should export name collisions between contracts domains (and between contracts types and existing latency types) be handled?
**Options**:
- A) Namespaced re-exports: Export colliding domains under namespace objects (e.g., `import { AgencyHumancy } from '@generacy-ai/latency'`) rather than flat re-export
- B) Rename on export: Rename colliding types with domain prefixes (e.g., `AgencyHumancyDecisionRequest` vs `DecisionModelDecisionRequest`)
- C) Subpath exports: Use package.json `exports` field with subpaths (e.g., `@generacy-ai/latency/protocols/agency-humancy`) so consumers import from specific subpaths instead of the root
- D) Selective root export: Only export non-colliding types from root; require subpath imports for colliding types
**Answer**: **C) Subpath exports.** Subpath exports via `package.json` `exports` field is the most scalable approach. Consumers use `import { ... } from '@generacy-ai/latency/protocols/agency-humancy'` while the existing root export (`@generacy-ai/latency`) remains backward-compatible. Non-colliding foundational types (from `common/`, `telemetry/`, etc.) can also be re-exported from root for convenience.

### Q2: Urgency Type Conflict
**Context**: Latency already defines `Urgency` as a union type `'low' | 'medium' | 'high' | 'critical'` in `facets/decision.ts`, used by the `DecisionHandler` facet. Contracts defines `Urgency` as a const object with values `'blocking_now' | 'blocking_soon' | 'when_available'` plus a Zod schema. These are semantically similar but structurally incompatible — different values, different patterns (union type vs const object + Zod schema).
**Question**: How should the conflicting `Urgency` definitions be reconciled?
**Options**:
- A) Keep both as-is: Export contracts' Urgency under a different name (e.g., `ContractUrgency` or `MessageUrgency`) and keep latency's facet Urgency unchanged
- B) Keep both, namespace by import path: Export contracts' Urgency only from `protocols/` subpath, not from root, to avoid collision with the facet Urgency
- C) Unify: Replace latency's facet Urgency with contracts' Urgency values (breaking change to facet consumers)
- D) Unify with superset: Create a merged Urgency type that includes both sets of values
**Answer**: **B) Namespace by import path.** These are semantically distinct types: latency's `Urgency` is severity-based (`low | medium | high | critical`) while contracts' is timing-based (`blocking_now | blocking_soon | when_available`). With subpath exports from Q1, contracts' `Urgency` is only available from its protocol subpath (e.g., `@generacy-ai/latency/protocols/common`), not from root. No breaking change, no rename needed.

### Q3: DecisionRequest / DecisionResult Name Collisions
**Context**: Latency already exports `DecisionRequest` and `DecisionResult` from `composition/context.ts` (simple interfaces for plugin decision routing). Contracts has `DecisionRequest`/`DecisionResponse` in `agency-humancy/` (Zod schemas for cross-component communication) and `DecisionRequest` in `schemas/decision-model/` (three-layer decision framework). These are different types with the same names. The spec says "no breaking changes to existing latency" but also "preserve public API" from contracts.
**Question**: How should the `DecisionRequest`/`DecisionResult` name collisions between existing latency types and contracts types be handled?
**Options**:
- A) Rename contracts types on import: e.g., `AgencyDecisionRequest`, `DecisionModelRequest` to avoid collision with latency's existing exports
- B) Rename latency's existing types: Rename to `PluginDecisionRequest`/`PluginDecisionResult` since they're less established (but this is a breaking change)
- C) Subpath-only export: Only export contracts' colliding types from domain subpaths, not from the package root
**Answer**: **C) Subpath-only export.** Same principle as Q2. Latency's existing `DecisionRequest`/`DecisionResult` (simple plugin routing) stay on the root export unchanged. Contracts' richer protocol types are available via their domain subpaths. No breaking changes, no renames.

### Q4: schemas/ Directory Scope
**Context**: The spec lists 7 domains to migrate (common, orchestration, agency-generacy, agency-humancy, generacy-humancy, telemetry, version-compatibility) and explicitly says `src/schemas/` is out of scope (Agency has a separate issue for tool schemas). However, `src/schemas/` in contracts contains far more than tool schemas — it includes `decision-model/`, `knowledge-store/`, `attribution-metrics/`, `learning-loop/`, `extension-comms/`, `platform-api/`, `data-export/`, and `github-app/`, which represent major domain schemas (~900+ exports). The contracts `src/index.ts` re-exports all of `schemas/` as part of its public API.
**Question**: Is the entire `src/schemas/` directory excluded from this migration, or only `src/schemas/tool-naming/` and `src/schemas/tool-result.ts` (the tool-specific schemas)?
**Options**:
- A) Entire schemas/ excluded: Only migrate the 7 listed domains; all schemas/ subdirectories are deferred to future work
- B) Only tool schemas excluded: Migrate decision-model, knowledge-store, attribution-metrics, learning-loop, extension-comms, platform-api, data-export, github-app alongside the 7 listed domains
- C) Selective inclusion: Migrate some schemas/ subdirectories (e.g., decision-model, knowledge-store) that are foundational, defer others that are more application-specific
**Answer**: **A) Entire schemas/ excluded.** Stick to the 7 domains listed in the issue spec. The schemas/ directory represents ~480 exports (66% of contracts) and would massively expand scope. Foundation schemas (decision-model, knowledge-store, etc.) can be a follow-up issue once the core 7 domains are settled.

### Q5: IDs Not Exported from common/index.ts
**Context**: The contracts `common/ids.ts` defines 8 branded ID types (CorrelationId, RequestId, SessionId, OrganizationId, MembershipId, InviteId, WorkItemId, AgentId), but `common/index.ts` only re-exports 3 of them (CorrelationId, RequestId, SessionId). The other 5 (OrganizationId, MembershipId, InviteId, WorkItemId, AgentId) are defined but not part of the public API via the barrel export. The spec says to migrate `ids.ts` and preserve branded IDs.
**Question**: Should all 8 branded ID types be migrated and exported, or only the 3 that are currently part of the contracts public API?
**Options**:
- A) All 8: Migrate all IDs from the source file, including those not currently re-exported (they exist for a reason and consumers may import them directly)
- B) Only public 3: Migrate only CorrelationId, RequestId, SessionId — the ones actually exported from contracts' barrel, matching the current public API
- C) All 8, but export only 3: Migrate all ID definitions for completeness but only re-export the 3 currently public ones from barrel exports
**Answer**: **C) All 8, but export only 3.** Migrate the full `ids.ts` file for completeness, but only re-export the 3 that contracts actually published (`CorrelationId`, `RequestId`, `SessionId`). If consumers need the other 5 later, it's a one-line barrel export change rather than a new migration.

### Q6: zod-to-json-schema Dependency
**Context**: Contracts has `zod-to-json-schema` as a runtime dependency (used only by generation scripts in `scripts/`, not by any `src/` code). The spec mentions migrating schema generation scripts (FR-015, P2) but doesn't mention `zod-to-json-schema` as a dependency to add. Adding it as a runtime dep would increase the dependency footprint unnecessarily if it's only used in build scripts.
**Question**: Should `zod-to-json-schema` be added to latency, and if so, as what kind of dependency?
**Options**:
- A) devDependency: Add as devDependency since it's only needed for script-time schema generation, not at runtime
- B) Skip entirely: Don't migrate the generation scripts; they can remain in the contracts repo or be handled separately
- C) Runtime dependency: Add as runtime dependency to match contracts' current setup
**Answer**: **A) devDependency.** It's only used by generation scripts, never at runtime. Adding as devDependency keeps the runtime dependency footprint clean while still enabling schema generation scripts when they're migrated (FR-015, P2).

### Q7: Build System Change (tsc vs tsup)
**Context**: Latency currently builds with plain `tsc` (preserving file structure 1:1 to dist/), has no bundler, and uses `"module": "NodeNext"` with `.js` extensions in imports. Contracts uses `tsup` (bundling to a single entry point) with `"module": "Node16"`. Adding Zod runtime code to latency means the build output now includes actual JavaScript (not just declaration files). The spec doesn't address whether the build system should change.
**Question**: Should latency's build system remain as plain `tsc`, or switch to `tsup` to match how contracts was built?
**Options**:
- A) Keep tsc: Continue using plain tsc — it already produces valid ESM JavaScript and declaration files, and works well with the multi-file structure
- B) Switch to tsup: Adopt tsup for bundling, tree-shaking, and a single dist entry point, matching contracts' build approach
- C) Add tsup alongside: Use tsup for the bundled output but keep tsc for type checking (`typecheck` script)
**Answer**: **A) Keep tsc.** The entire latency monorepo uses plain `tsc`. Switching one package to tsup would be inconsistent. `tsc` already produces valid ESM JavaScript and declaration files. Bundling to a single entry point would actually work against the subpath exports approach from Q1 (which benefits from preserved file structure).

### Q8: Test Location Convention
**Context**: The spec says tests should use `__tests__/*.test.ts` pattern at the package root, but contracts has tests co-located with source code (`src/domain/__tests__/*.test.ts`). The proposed file structure shows `__tests__/` at the package root with subdirectories mirroring the source structure. However, the root-level `vitest` in the workspace (v3.2.4) differs from contracts' vitest (v2.1.8). The spec doesn't clarify whether to use the workspace root vitest or add vitest as a package-level devDependency.
**Question**: Should the latency package use the workspace root vitest (v3.2.4 already in root devDependencies) or add its own vitest devDependency?
**Options**:
- A) Use workspace root vitest: Rely on the vitest already in root devDependencies (v3.2.4) — consistent with the monorepo pattern, no extra dependency
- B) Add package-level vitest: Add vitest as a devDependency in packages/latency/package.json for version isolation
**Answer**: **A) Use workspace root vitest.** The monorepo already has `vitest@^3.2.4` at the root level and other packages rely on it. Tests should go in `__tests__/` following latency's existing convention.

### Q9: TypeScript Strict Mode Alignment
**Context**: Contracts uses several strict TypeScript flags that latency's base config doesn't enable: `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`. Migrating code written under stricter settings into a less strict environment may mask issues, while enabling the stricter flags in latency could break existing code.
**Question**: Should latency's tsconfig adopt the stricter flags from contracts, or migrate the code as-is under the current less strict config?
**Options**:
- A) Keep current config: Migrate code under latency's existing strict settings — any extra strictness from contracts was a contracts-specific choice
- B) Adopt stricter flags for migrated code only: Use a separate tsconfig for the migrated directories with stricter settings via project references
- C) Adopt stricter flags globally: Update latency's tsconfig.base.json to match contracts' strictness (may require fixes to existing latency code)
**Answer**: **A) Keep current config.** Latency already has `"strict": true` which covers the core strictness guarantees. The extra flags from contracts are stricter but could break existing latency code if applied globally. Any minor adjustments needed (e.g., removing unused parameters) can be handled during migration. Adopting stricter flags globally can be a separate initiative.

### Q10: Downstream Consumer Migration Path
**Context**: The spec says updating downstream consumers (Agency, Generacy, Humancy) to import from `@generacy-ai/latency` instead of `@generacy-ai/contracts` is out of scope. However, the spec also says "no active repo currently depends on @generacy-ai/contracts." If SC-005 (API compatibility — "import path swap only") is a success criterion, there should be a way to verify it. Without a concrete consumer to test against, export completeness (SC-003) can only be verified by comparing export lists.
**Question**: How should SC-003 (export completeness) and SC-005 (API compatibility) be verified without downstream consumers in scope?
**Options**:
- A) Automated export comparison: Write a script or test that compares contracts' exports against latency's exports for the migrated domains, ensuring every public name is available
- B) Manual review: Compare barrel export files side-by-side during code review
- C) Smoke test: Create a small test file that imports every type from `@generacy-ai/latency` the way a consumer would, verifying IntelliSense and compilation
**Answer**: **A + C combined.** Use both: an automated export comparison script (A) that diffs contracts' public exports against latency's exports for the migrated domains (mechanical and CI-able), plus a smoke test file (C) that imports every migrated type as a consumer would and verifies compilation. Together they cover SC-003 (completeness) and SC-005 (API compatibility) without needing actual downstream consumers.
