# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 14:51

### Q1: Core Type Definitions
**Context**: The spec imports CICDPipeline, Pipeline, PipelineRun, TriggerOptions, and ValidationError from @generacy-ai/latency, but none of these types exist yet in the core package. This plugin cannot be implemented without them.
**Question**: Should this issue also define the CI/CD facet types in @generacy-ai/latency (e.g., a new cicd.ts facet file), or is there a separate issue for creating those types that should be completed first?
**Options**:
- A: This issue should define the facet types in @generacy-ai/latency as part of the implementation
- B: A separate issue handles the core types; this issue only implements the abstract plugin (blocked until types exist)
- C: Define minimal stub types in this plugin package and move them to core later

**Answer**: *Pending*

### Q2: Status Polling Behavior
**Context**: The spec lists 'Add status polling utilities' as a task but doesn't define the polling strategy. Different strategies have very different complexity and reliability characteristics.
**Question**: What polling behavior should the status polling utilities support? Specifically: should it use fixed interval, exponential backoff, or configurable strategy? Should there be a timeout/max-attempts limit?
**Options**:
- A: Simple fixed-interval polling with configurable interval and max attempts
- B: Exponential backoff with jitter, configurable base interval, max interval, and timeout
- C: Pluggable strategy pattern where subclasses can provide their own polling logic

**Answer**: *Pending*

### Q3: Log Streaming Interface
**Context**: The spec lists 'Add log streaming utilities' as a task but doesn't define how logs are streamed. This affects the API surface that all CI/CD provider implementations must conform to.
**Question**: What should the log streaming interface look like? Should it use async iterators, event emitters, callback-based streaming, or Observable pattern?
**Options**:
- A: AsyncIterableIterator<LogLine> (modern async iteration, works with for-await-of)
- B: EventEmitter-based with 'data', 'end', 'error' events
- C: ReadableStream<LogLine> (Web Streams API)

**Answer**: *Pending*

### Q4: Package Location
**Context**: The monorepo has packages under /packages/latency/. The new plugin package needs a defined location and naming convention consistent with the ecosystem.
**Question**: Where should the plugin package be located? Should it be at packages/latency-plugin-ci-cd/ as a sibling to packages/latency/, or nested differently?
**Options**:
- A: packages/latency-plugin-ci-cd/ (sibling to packages/latency/)
- B: packages/plugins/latency-plugin-ci-cd/ (under a plugins subdirectory)

**Answer**: *Pending*

### Q5: Error Handling Strategy
**Context**: The spec uses a ValidationError class but only FacetError exists in the core package. The error hierarchy affects how consumers catch and handle errors from all plugins.
**Question**: Should ValidationError extend the existing FacetError from @generacy-ai/latency/facets/common.ts, or should it be a standalone error class defined in this plugin?
**Options**:
- A: Extend FacetError (follows existing pattern, enables catch-all for facet errors)
- B: Standalone error class in this plugin package (independent, no core dependency for errors)

**Answer**: *Pending*

