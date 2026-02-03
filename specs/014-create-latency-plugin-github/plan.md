# Implementation Plan: Create latency-plugin-github-actions + interface

**Feature**: GitHub Actions CI/CD plugin implementation and type interface package
**Branch**: `014-create-latency-plugin-github`
**Status**: Complete

## Summary

Create two new packages in the monorepo:
1. **`@generacy-ai/github-actions-interface`** — TypeScript type definitions for GitHub Actions concepts (workflows, runs, jobs, steps, artifacts), extending the core `Pipeline`/`PipelineRun` types from `@generacy-ai/latency`.
2. **`@generacy-ai/latency-plugin-github-actions`** — Concrete CI/CD plugin extending `AbstractCICDPlugin` from `@generacy-ai/latency-plugin-ci-cd`, implementing all four abstract methods using the GitHub Actions API via `@octokit/rest`.

## Technical Context

| Aspect | Detail |
|--------|--------|
| Language | TypeScript 5.4+ (strict mode) |
| Module System | ESM (`NodeNext`) |
| Build Tool | `tsc` |
| Test Framework | Vitest 3.x |
| Package Manager | pnpm 9.x (workspaces) |
| Target | ES2022 |
| External API | GitHub Actions REST API via `@octokit/rest` |

## Design Decisions

These address the pending clarification questions with reasonable defaults based on codebase patterns:

| # | Decision | Rationale |
|---|----------|-----------|
| Q1 | Implement all four abstract methods (`doTrigger`, `doGetStatus`, `doCancel`, `doListPipelines`) | All have direct Octokit API equivalents; shipping stubs defeats the purpose of the plugin |
| Q2 | Use `packages/latency-plugin-github-actions/` and `packages/github-actions-interface/` | Matches the longer naming convention used by `latency-plugin-source-control`, `latency-plugin-issue-tracker`, `latency-plugin-dev-agent` |
| Q3 | Map standard `TriggerOptions` fields (`branch`→`ref`, `parameters`→`inputs`) | Maintains interface consistency across plugins; consumers use the same `TriggerOptions` regardless of provider |
| Q4 | Mirror GitHub API shapes closely for `GitHubWorkflowTrigger`, `GitHubStep`, `GitHubArtifact` | The interface package exists specifically for consumers who need GitHub-specific detail; simplified types belong in the core `Pipeline` abstraction |
| Q5 | Return a synthetic `PipelineRun` with status `'pending'` after dispatch | Polling is fragile and race-prone; consumers can call `getPipelineStatus` to get the real run when ready |

## Project Structure

```
packages/
├── github-actions-interface/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                    # Re-exports all types and helpers
│       ├── types.ts                    # GitHubWorkflow, GitHubWorkflowRun, GitHubJob, GitHubStep, etc.
│       ├── type-guards.ts             # isGitHubWorkflowRun, isGitHubJob
│       └── helpers.ts                 # getWorkflowRunUrl, utility functions
│
├── latency-plugin-github-actions/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── index.ts                   # Re-exports plugin class and config type
│   │   ├── github-actions-plugin.ts   # GitHubActionsPlugin extends AbstractCICDPlugin
│   │   └── config.ts                  # GitHubActionsConfig interface
│   └── __tests__/
│       └── github-actions-plugin.test.ts  # Unit tests with mocked Octokit
```

## Dependency Graph

```
@generacy-ai/latency (core types: Pipeline, PipelineRun, FacetError)
    ↑
@generacy-ai/github-actions-interface (GitHub-specific types extending core)
    ↑
@generacy-ai/latency-plugin-ci-cd (AbstractCICDPlugin, pollUntilComplete, LogStream)
    ↑
@generacy-ai/latency-plugin-github-actions (concrete implementation)
    ↑
@octokit/rest (external: GitHub API client)
```

## Implementation Details

### Interface Package (`github-actions-interface`)

**types.ts** — All GitHub Actions type definitions:

```typescript
// Extends core Pipeline
interface GitHubWorkflow extends Pipeline {
  path: string;                                    // e.g. ".github/workflows/ci.yml"
  state: 'active' | 'disabled_inactivity' | 'disabled_manually';
  triggers: GitHubWorkflowTrigger[];
}

// Extends core PipelineRun
interface GitHubWorkflowRun extends PipelineRun {
  workflowId: number;
  runNumber: number;
  attempt: number;
  triggeredBy: string;
  headSha: string;
  headBranch: string;
  jobs: GitHubJob[];
}

// GitHub-specific types (mirror API shapes)
interface GitHubWorkflowTrigger {
  event: string;                                   // 'push', 'pull_request', 'workflow_dispatch', etc.
  branches?: string[];
  paths?: string[];
  cron?: string;                                   // For schedule triggers
}

interface GitHubJob {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  steps: GitHubStep[];
}

interface GitHubStep {
  number: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
}

interface GitHubArtifact {
  id: number;
  name: string;
  sizeInBytes: number;
  archiveDownloadUrl: string;
  expired: boolean;
  createdAt: Date;
  expiresAt?: Date;
}
```

**type-guards.ts** — Runtime type narrowing:

```typescript
function isGitHubWorkflowRun(run: PipelineRun): run is GitHubWorkflowRun;
function isGitHubJob(value: unknown): value is GitHubJob;
```

**helpers.ts** — Utility functions:

```typescript
function getWorkflowRunUrl(run: GitHubWorkflowRun, owner: string, repo: string): string;
```

### Plugin Package (`latency-plugin-github-actions`)

**config.ts** — Configuration:

```typescript
interface GitHubActionsConfig {
  token: string;          // GitHub personal access token or app token
  owner: string;          // Repository owner
  repo: string;           // Repository name
  apiBaseUrl?: string;     // For GitHub Enterprise (optional)
}
```

**github-actions-plugin.ts** — Main plugin class:

| Method | Octokit API | Notes |
|--------|-------------|-------|
| `doTrigger` | `actions.createWorkflowDispatch` | Maps `branch`→`ref`, `parameters`→`inputs`; returns synthetic pending run |
| `doGetStatus` | `actions.getWorkflowRun` + `actions.listJobsForWorkflowRun` | Maps API response to `GitHubWorkflowRun` |
| `doCancel` | `actions.cancelWorkflowRun` | Void return |
| `doListPipelines` | `actions.listRepoWorkflows` | Maps to `GitHubWorkflow[]` |

Additional GitHub-specific public methods:
| Method | Octokit API | Return |
|--------|-------------|--------|
| `getWorkflowLogs(runId)` | `actions.downloadJobLogsForWorkflowRun` | `string` |
| `rerunWorkflow(runId)` | `actions.reRunWorkflow` | `GitHubWorkflowRun` |
| `listArtifacts(runId)` | `actions.listWorkflowRunArtifacts` | `GitHubArtifact[]` |
| `downloadArtifact(artifactId)` | `actions.downloadArtifact` | `Buffer` |

**Response mapping**: A private helper maps Octokit API responses to the interface types. Key mappings:
- `workflow_run.status` → `PipelineStatus`: `'queued'`→`'pending'`, `'in_progress'`→`'running'`, `'completed'`→ check `conclusion`
- `workflow_run.conclusion` → `PipelineStatus`: `'success'`→`'completed'`, `'failure'`/`'timed_out'`→`'failed'`, `'cancelled'`→`'cancelled'`
- Timestamps: ISO strings → `Date` objects

### Testing Strategy

**Unit tests** with mocked Octokit (no real API calls):

1. **Constructor** — Validates config, initializes Octokit with token and optional baseUrl
2. **doTrigger** — Calls `createWorkflowDispatch` with mapped options, returns synthetic pending run
3. **doGetStatus** — Calls `getWorkflowRun` + `listJobsForWorkflowRun`, maps response correctly
4. **doCancel** — Calls `cancelWorkflowRun` with correct owner/repo/run_id
5. **doListPipelines** — Calls `listRepoWorkflows`, maps response to `GitHubWorkflow[]`
6. **GitHub-specific methods** — Test `getWorkflowLogs`, `rerunWorkflow`, `listArtifacts`, `downloadArtifact`
7. **Status mapping** — Verify all GitHub status/conclusion combinations map correctly to `PipelineStatus`
8. **Type guards** — Verify `isGitHubWorkflowRun` correctly identifies GitHub runs vs generic runs
9. **Helpers** — Verify `getWorkflowRunUrl` generates correct URLs

**Mocking approach**: Create a mock Octokit instance with `vi.fn()` for each API method. Test that the plugin delegates correctly and maps responses.

## Package Configuration

### github-actions-interface/package.json
```json
{
  "name": "@generacy-ai/github-actions-interface",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "peerDependencies": {
    "@generacy-ai/latency": "^0.1.0"
  },
  "devDependencies": {
    "@generacy-ai/latency": "workspace:*",
    "typescript": "^5.4.5",
    "@types/node": "^20.14.0"
  }
}
```

### latency-plugin-github-actions/package.json
```json
{
  "name": "@generacy-ai/latency-plugin-github-actions",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "peerDependencies": {
    "@generacy-ai/latency": "^0.1.0",
    "@generacy-ai/latency-plugin-ci-cd": "^0.1.0",
    "@generacy-ai/github-actions-interface": "^0.1.0"
  },
  "dependencies": {
    "@octokit/rest": "^21.0.0"
  },
  "devDependencies": {
    "@generacy-ai/latency": "workspace:*",
    "@generacy-ai/latency-plugin-ci-cd": "workspace:*",
    "@generacy-ai/github-actions-interface": "workspace:*",
    "typescript": "^5.4.5",
    "@types/node": "^20.14.0",
    "vitest": "^3.0.0"
  }
}
```

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `createWorkflowDispatch` returns void, no run ID | Certain | Return synthetic pending run; document that consumers should poll via `getPipelineStatus` |
| Octokit types may drift from actual API | Low | Pin `@octokit/rest` version; use Octokit's built-in TypeScript types |
| GitHub API rate limiting | Medium | Not in scope for initial implementation; can be added as middleware later |
| GitHub Enterprise compatibility | Low | Support optional `apiBaseUrl` in config for GHE instances |

---

*Generated by speckit*
