# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 14:50

### Q1: Missing Core Types
**Context**: The spec imports DevAgent, AgentResult, InvokeOptions, and AgentCapabilities from @generacy-ai/latency, but these types do not exist in the core package. The core package currently defines composition types (PluginManifest, PluginContext, FacetProvider) and facet interfaces (IssueTracker, SourceControl, etc.) but has no dev-agent-related types.
**Question**: Should we create the DevAgent, AgentResult, InvokeOptions, and AgentCapabilities types as a new facet in the core @generacy-ai/latency package (similar to the existing facets like IssueTracker), or should they be defined locally within this plugin package?
**Options**:
- A: Add as a new facet in @generacy-ai/latency (e.g., src/facets/dev-agent.ts) — consistent with existing architecture
- B: Define locally in this plugin package — keeps core package unchanged

**Answer**: *Pending*

### Q2: Timeout Handling Behavior
**Context**: The spec lists 'Implement timeout handling' as a task and 'Timeout handling works correctly' as an acceptance criterion, but provides no details on how timeouts should work.
**Question**: What should happen when an invocation times out? Specifically: Should a default timeout be configurable per-instance or per-invocation? Should it abort the underlying operation (via AbortController) or just reject the promise while letting the operation continue?
**Options**:
- A: Per-invocation timeout via InvokeOptions, aborts via AbortController signal
- B: Default timeout on class constructor, overridable per-invocation, aborts via AbortController
- C: Per-invocation only, rejects promise but does not abort the underlying operation

**Answer**: *Pending*

### Q3: Streaming Support Scope
**Context**: The spec lists 'Add streaming support utilities' as a task but provides no details on what streaming means in this context.
**Question**: What form should streaming support take? Should the abstract class provide helpers for token-by-token streaming of agent responses (e.g., AsyncIterator/ReadableStream), or is this about streaming progress events during invocation?
**Options**:
- A: AsyncIterator-based token streaming (for LLM-style incremental responses)
- B: Event/callback-based progress streaming (status updates during execution)
- C: Both token streaming and progress events

**Answer**: *Pending*

### Q4: Plugin Manifest Integration
**Context**: The core package defines a PluginManifest/PluginContext system for plugins. The spec shows AbstractDevAgentPlugin implementing DevAgent but doesn't show how it integrates with the existing plugin composition system (PluginManifest, FacetProvider, PluginContext).
**Question**: Should AbstractDevAgentPlugin integrate with the existing PluginManifest/PluginContext composition system (implementing manifest, activation via context), or should it be a standalone abstract class independent of the composition layer?
**Options**:
- A: Integrate with PluginManifest/PluginContext — each agent plugin registers as a facet provider
- B: Standalone abstract class — composition integration deferred to a later issue

**Answer**: *Pending*

### Q5: ValidationError Definition
**Context**: The implementation code uses 'throw new ValidationError(...)' but ValidationError is not defined in the core package or the spec. The core package has FacetError in common.ts.
**Question**: Should ValidationError extend the existing FacetError from the core package, be a new independent error class in this plugin, or should we use FacetError directly?
**Options**:
- A: Extend FacetError from @generacy-ai/latency — reuses existing error hierarchy
- B: New independent error class in this plugin package
- C: Use FacetError directly with a 'VALIDATION' error code

**Answer**: *Pending*

