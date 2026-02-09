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

**Answer**: *Pending*

### Q2: Documentation Approach
**Context**: Multiple options exist to document facets as planned/future: JSDoc @planned tags, a planned/ subdirectory, or README documentation. Consistency is important for maintainability.
**Question**: What documentation approach should be used to mark facets as planned/future?
**Options**:
- A: JSDoc @planned tag on each interface (inline, discoverable via IDE)
- B: Move to facets/planned/ subdirectory (physical separation)
- C: README in facets/ explaining maturity levels (centralized documentation)
- D: Combination: JSDoc tags + README overview

**Answer**: *Pending*

### Q3: StateStore Reconciliation
**Context**: Two StateStore interfaces exist with different semantics: async (facets/state.ts) vs sync (composition/context.ts). This creates naming confusion and potential misuse.
**Question**: How should the dual StateStore definitions be reconciled?
**Options**:
- A: Rename sync version to SyncStateStore or ContextState (keep both, clarify purpose)
- B: Remove sync version - only the async facet version should exist
- C: Consolidate into one interface that supports both patterns
- D: Remove async version from facets (it's unused) - keep only the sync one in context.ts

**Answer**: *Pending*

