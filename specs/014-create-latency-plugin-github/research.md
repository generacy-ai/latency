# Research: GitHub Actions Plugin

## Technology Decisions

### 1. GitHub API Client: `@octokit/rest`

**Decision**: Use `@octokit/rest` as the GitHub API client.

**Rationale**:
- Official GitHub SDK for Node.js, maintained by GitHub
- Full TypeScript support with auto-generated types from the API schema
- Handles authentication, pagination, rate limiting headers
- Supports both github.com and GitHub Enterprise via `baseUrl` option
- Specified in the issue requirements

**Alternatives considered**:
- **Raw `fetch`/`node-fetch`**: Lower-level, would require manual auth handling, pagination, error mapping. No benefit over Octokit.
- **`@octokit/core`**: Lighter weight but requires manual endpoint construction. `@octokit/rest` provides typed method signatures for every endpoint.
- **GraphQL (`@octokit/graphql`)**: GitHub Actions API is REST-only; no GraphQL coverage for workflow dispatch or run management.

### 2. Synthetic Run After Dispatch

**Decision**: Return a synthetic `PipelineRun` with `status: 'pending'` after `createWorkflowDispatch`.

**Rationale**:
- `createWorkflowDispatch` returns HTTP 204 (no content) — no run ID is available
- Polling `listWorkflowRuns` to find the new run is unreliable: runs may take up to 30 seconds to appear, and concurrent dispatches create race conditions
- A synthetic run communicates "dispatch succeeded, run not yet available" clearly
- Consumers call `getPipelineStatus` with the workflow ID when they need the actual run

**Alternatives considered**:
- **Poll after dispatch**: Fragile timing, race-prone with concurrent triggers, adds latency to the trigger call
- **Return null/throw**: Breaks the `PipelineRun` return type contract of the abstract class

### 3. Status Mapping Strategy

**Decision**: Map GitHub's `status`+`conclusion` pair to the core `PipelineStatus` union.

| GitHub status | GitHub conclusion | → PipelineStatus |
|---------------|-------------------|------------------|
| `queued` | — | `pending` |
| `in_progress` | — | `running` |
| `completed` | `success` | `completed` |
| `completed` | `failure` | `failed` |
| `completed` | `timed_out` | `failed` |
| `completed` | `cancelled` | `cancelled` |
| `completed` | `skipped` | `completed` |
| `completed` | `action_required` | `running` |

**Rationale**: Maps naturally to the five-state `PipelineStatus`. `skipped` is treated as `completed` (it finished, just didn't execute). `action_required` maps to `running` since the run is still active and waiting for intervention.

### 4. Interface Design: Mirror GitHub API

**Decision**: GitHub-specific interfaces mirror the API response shapes rather than providing simplified abstractions.

**Rationale**:
- The interface package exists for consumers who specifically need GitHub Actions detail
- Consumers wanting simplified types already have `Pipeline`/`PipelineRun` from the core
- Mirroring the API makes it easy to map responses and keeps types predictable for anyone familiar with the GitHub API
- Fields like `GitHubStep.number`, `GitHubArtifact.archiveDownloadUrl` are useful for GitHub-specific operations

### 5. TriggerOptions Field Mapping

**Decision**: Map standard `TriggerOptions` fields to GitHub API parameters.

| TriggerOptions | GitHub API | Notes |
|----------------|------------|-------|
| `branch` | `ref` | Branch/tag to run against |
| `parameters` | `inputs` | Workflow dispatch inputs |
| `environment` | (ignored) | GitHub Actions doesn't support env vars at dispatch time |

**Rationale**: Maintains the plugin abstraction — consumers use the same `TriggerOptions` interface regardless of CI/CD provider. The mapping is straightforward and documented.

## Implementation Patterns

### Octokit Mocking for Tests

The Octokit instance will be injected via constructor config, making it straightforward to mock:

```typescript
// Create a mock with typed methods
const mockOctokit = {
  actions: {
    createWorkflowDispatch: vi.fn(),
    getWorkflowRun: vi.fn(),
    listJobsForWorkflowRun: vi.fn(),
    cancelWorkflowRun: vi.fn(),
    listRepoWorkflows: vi.fn(),
    downloadJobLogsForWorkflowRun: vi.fn(),
    reRunWorkflow: vi.fn(),
    listWorkflowRunArtifacts: vi.fn(),
    downloadArtifact: vi.fn(),
  }
};
```

### Error Handling

GitHub API errors will be caught and re-thrown as `FacetError` with appropriate codes:
- 401/403 → `FacetError('AUTH')`
- 404 → `FacetError('NOT_FOUND')`
- 422 → `FacetError('VALIDATION_ERROR')`
- Other → `FacetError('PROVIDER_ERROR')` with original error as cause

## Key References

- [GitHub Actions REST API](https://docs.github.com/en/rest/actions) — Official API documentation
- [`@octokit/rest` npm](https://www.npmjs.com/package/@octokit/rest) — GitHub SDK
- [`AbstractCICDPlugin`](../../packages/plugin-ci-cd/src/abstract-ci-cd-plugin.ts) — Base class being extended
- [GitHub workflow_dispatch event](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch) — Dispatch limitations

---

*Generated by speckit*
