# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-09 00:04

### Q1: Facet Retention Criteria
**Context**: Need to decide which of the 5 unused facet interfaces (EventBus, SecretStore, StateStore, DecisionHandler, WorkflowEngine) should be kept as planned features vs removed. This affects how much cleanup work is needed.
**Question**: Which of these unused facets are still part of the roadmap and should be kept (documented as planned)?
**Options**:
- A: Keep all 5 as planned - they're all part of the future vision
- B: Keep EventBus, SecretStore, WorkflowEngine; remove DecisionHandler and StateStore (StateStore is duplicated anyway)
- C: Remove all - start fresh when actually needed
- D: Other (specify which to keep/remove)

**Answer**: **A — Keep all 5 as planned**

All five facets are explicitly referenced in the active roadmap:
- **DecisionHandler** — Integration plan Phase 3.3 and execution plan Wave 6 both specify Humancy will register as a `DecisionHandler` facet provider
- **WorkflowEngine** — Phase 3.2 and Wave 6 specify Generacy provides `WorkflowEngine`
- **EventBus, StateStore, SecretStore** — All listed as core cross-cutting concern facets in the architecture doc's facet categories table

These aren't speculative — they're defined interfaces waiting for Phase 3 consumer adoption.

### Q2: Documentation Approach
**Context**: Multiple options exist to document facets as planned/future: JSDoc @planned tags, a planned/ subdirectory, or README documentation. Consistency is important for maintainability.
**Question**: What documentation approach should be used to mark facets as planned/future?
**Options**:
- A: JSDoc @planned tag on each interface (inline, discoverable via IDE)
- B: Move to facets/planned/ subdirectory (physical separation)
- C: README in facets/ explaining maturity levels (centralized documentation)
- D: Combination: JSDoc tags + README overview

**Answer**: **D — JSDoc tags + README overview**

With a nuance: the tag shouldn't be `@planned` since these facets are already defined and stable. Something like `@remarks Currently awaiting consumer adoption in Phase 3` is more accurate. The README in `facets/` can give a centralized view of which facets have active consumers (IssueTracker, SourceControl, DevAgent, etc.) vs. which are awaiting Phase 3 core updates.

### Q3: StateStore Reconciliation
**Context**: Two StateStore interfaces exist with different semantics: async (facets/state.ts) vs sync (composition/context.ts). This creates naming confusion and potential misuse.
**Question**: How should the dual StateStore definitions be reconciled?
**Options**:
- A: Rename sync version to SyncStateStore or ContextState (keep both, clarify purpose)
- B: Remove sync version - only the async facet version should exist
- C: Consolidate into one interface that supports both patterns
- D: Remove async version from facets (it's unused) - keep only the sync one in context.ts

**Answer**: **A — Rename the sync version**

The two serve clearly different purposes:
- `facets/state.ts` StateStore = async, generic, for persistent storage backends (Redis, S3, etc.) — this is the public facet API matching the architecture doc
- `composition/context.ts` StateStore = sync, for plugin-scoped in-memory state — this is an internal composition mechanism

Rename the sync version to `PluginStateStore` or `ContextState` to preserve both while eliminating the naming collision. The async facet version is the architecturally important one.

