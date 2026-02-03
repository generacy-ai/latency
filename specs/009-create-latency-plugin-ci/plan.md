# Implementation Plan: Create latency-plugin-ci-cd (abstract)

**Feature**: Abstract CI/CD plugin providing common logic for all pipeline implementations
**Branch**: `009-create-latency-plugin-ci`
**Status**: Complete

## Summary

Create a new `@generacy-ai/latency-plugin-ci-cd` package containing the `AbstractCICDPlugin` abstract base class. This class implements the `CICDPipeline` facet interface and provides common pipeline orchestration logic (input validation, status polling, log streaming) that concrete implementations (GitHub Actions, Cloud Build, etc.) extend.

Before creating the plugin package, the core `@generacy-ai/latency` package must be extended with the CI/CD facet types: `CICDPipeline`, `Pipeline`, `PipelineRun`, and `TriggerOptions`.

## Technical Context

- **Language**: TypeScript 5.4+, targeting ES2022
- **Module System**: ESM (`"type": "module"`, `NodeNext` module resolution)
- **Build**: Direct `tsc` compilation (no bundler)
- **Package Manager**: pnpm 9.15.5 monorepo with `packages/*` workspace
- **Runtime**: Node.js >= 20.0.0
- **Testing**: vitest (to be added; no test framework currently configured)

## Dependencies

- `@generacy-ai/latency` — peer dependency for facet types (`CICDPipeline`, `Pipeline`, `PipelineRun`, `TriggerOptions`, `FacetError`)

## Project Structure

### Core Package Changes (packages/latency/)

```
packages/latency/src/facets/
├── pipeline.ts           # NEW — CICDPipeline facet interface + supporting types
└── index.ts              # MODIFY — add pipeline.ts re-export
```

### New Plugin Package (packages/plugin-ci-cd/)

```
packages/plugin-ci-cd/
├── package.json          # @generacy-ai/latency-plugin-ci-cd
├── tsconfig.json         # extends ../../tsconfig.base.json
├── src/
│   ├── index.ts          # Package entry — re-exports all public API
│   ├── abstract-ci-cd-plugin.ts  # AbstractCICDPlugin base class
│   ├── polling.ts        # Status polling utilities (pollUntilComplete, PollOptions)
│   └── log-stream.ts     # Log streaming utilities (LogLine, LogStream interface)
└── tests/
    ├── abstract-ci-cd-plugin.test.ts  # Unit tests for abstract class
    ├── polling.test.ts                # Polling utility tests
    └── log-stream.test.ts             # Log stream tests
```

## Implementation Approach

### Phase 1: Core Facet Types

Add `pipeline.ts` to `packages/latency/src/facets/` defining:

- **`PipelineStatus`** — Union type: `'pending' | 'running' | 'completed' | 'failed' | 'cancelled'`
- **`TriggerOptions`** — Configuration for triggering a pipeline (branch, parameters, environment)
- **`Pipeline`** — Metadata about a pipeline definition (id, name, description, defaultBranch)
- **`PipelineRun`** — A pipeline execution instance (id, pipelineId, status, timestamps, logs URL)
- **`CICDPipeline`** — Facet interface with `triggerPipeline`, `getPipelineStatus`, `cancelPipeline`, `listPipelines`

These follow the existing facet patterns (async-first, using `FacetError` for errors, `PaginatedQuery`/`PaginatedResult` for lists).

### Phase 2: Abstract Plugin Class

Create `AbstractCICDPlugin` implementing `CICDPipeline`:

- Public methods perform input validation then delegate to abstract `do*` methods
- Uses `FacetError` with appropriate codes (`VALIDATION_ERROR`, `NOT_FOUND`, etc.)
- Abstract methods: `doTrigger`, `doGetStatus`, `doCancel`, `doListPipelines`

### Phase 3: Utilities

- **Polling** — `pollUntilComplete(fn, options)` utility that polls a status function at configurable intervals with timeout, exponential backoff, and abort signal support
- **Log Streaming** — `LogLine` interface and `LogStream` abstract class providing async iterable log streaming with buffering

### Phase 4: Tests

- Use vitest for unit tests
- Test the abstract class via a concrete test subclass
- Test polling with fake timers
- Test log streaming with mock data

## Key Technical Decisions

1. **FacetError over ValidationError** — The spec references `ValidationError` but the codebase uses `FacetError` with error codes. We'll use `FacetError` with code `'VALIDATION_ERROR'` for consistency.

2. **Peer dependency on @generacy-ai/latency** — The plugin depends on the core package for types but shouldn't bundle it. This allows the core to remain the single source of truth for facet interfaces.

3. **vitest for testing** — No test framework exists yet. vitest aligns with the ESM-first approach and requires minimal configuration.

4. **Polling as a standalone utility** — Status polling is useful beyond CI/CD. Implementing it as a composable function rather than baking it into the abstract class makes it reusable.

5. **Log streaming as abstract class** — Different CI/CD providers stream logs differently. An abstract `LogStream` base with async iteration lets subclasses implement provider-specific fetching while consumers get a uniform interface.

## Constitution Check

No `.specify/memory/constitution.md` file exists. No governance constraints to verify.
