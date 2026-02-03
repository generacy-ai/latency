# Implementation Plan: Create latency-plugin-github-issues + interface

**Feature**: GitHub Issues plugin and interface packages for the Latency ecosystem
**Branch**: `010-create-latency-plugin-github`
**Status**: Complete

## Summary

Create two new packages in the Latency monorepo:

1. **@generacy-ai/github-issues-interface** — Zero-dependency interface package defining `GitHubIssue`, `GitHubIssueSpec`, type guards, and helper utilities. Consumers depend only on this package for type information.

2. **@generacy-ai/latency-plugin-github-issues** — Implementation package extending `AbstractIssueTrackerPlugin` with full GitHub REST API integration via `@octokit/rest`. Implements all five abstract methods plus GitHub-specific extras (`linkPullRequest`, `addLabels`).

## Technical Context

- **Language**: TypeScript 5.4+ (strict mode)
- **Runtime**: Node.js 20+
- **Module System**: ESM (`"type": "module"`, `"module": "NodeNext"`)
- **Build**: `tsc` (no bundler — consistent with all existing packages)
- **Test Framework**: Vitest 3.x
- **Package Manager**: pnpm with workspace protocol
- **Key Dependency**: `@octokit/rest` for GitHub API (plugin package only)

## Project Structure

```
packages/
├── github-issues-interface/
│   ├── src/
│   │   ├── types.ts            # GitHubIssue, GitHubIssueSpec, GitHubMilestone, etc.
│   │   ├── guards.ts           # isGitHubIssue type guard
│   │   ├── helpers.ts          # getGitHubIssueUrl, parseGitHubIssueRef
│   │   └── index.ts            # Re-exports all public API
│   ├── __tests__/
│   │   ├── guards.test.ts
│   │   └── helpers.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
└── latency-plugin-github-issues/
    ├── src/
    │   ├── plugin.ts           # GitHubIssuesPlugin class
    │   ├── client.ts           # GitHubClient — thin Octokit wrapper
    │   ├── mappers.ts          # API response → GitHubIssue/Comment mappers
    │   ├── errors.ts           # mapGitHubError — Octokit errors → FacetError
    │   └── index.ts            # Re-exports plugin, config, client
    ├── __tests__/
    │   ├── plugin.test.ts      # Full plugin tests with mocked Octokit
    │   ├── mappers.test.ts     # Mapper unit tests
    │   └── errors.test.ts      # Error mapping tests
    ├── package.json
    ├── tsconfig.json
    └── vitest.config.ts
```

## Implementation Approach

### Phase 1: Interface Package (`github-issues-interface`)

Build the interface package first since the plugin package depends on it.

**types.ts**: Define all GitHub-specific types extending the core Latency types:
- `GitHubIssue extends Issue` — adds `number`, `repository`, `htmlUrl`, `linkedPRs`, `milestone?`, `projects?`, `reactions?`
- `GitHubIssueSpec extends IssueSpec` — adds `milestone?`, `project?`, `labels?` for GitHub-specific creation fields
- `GitHubMilestone`, `GitHubProjectItem`, `GitHubReactions` — supporting interfaces

**guards.ts**: Type guard function:
- `isGitHubIssue(issue: Issue): issue is GitHubIssue` — checks for `repository`, `number`, and `htmlUrl` properties

**helpers.ts**: Utility functions:
- `getGitHubIssueUrl(issue: GitHubIssue): string` — returns `htmlUrl`
- `parseGitHubIssueRef(ref: string)` — parses `owner/repo#123` format into `{ owner, repo, number }`

**package.json**: Zero runtime dependencies. Only `@generacy-ai/latency` as a dependency (for types).

### Phase 2: Plugin Package (`latency-plugin-github-issues`)

**errors.ts**: Error mapping utility:
- `mapGitHubError(error: unknown): FacetError` — maps Octokit/HTTP errors to `FacetError` codes:
  - 404 → `NOT_FOUND`
  - 401/403 → `AUTH_ERROR`
  - 429 → `RATE_LIMIT`
  - Other → `UNKNOWN`
- Preserves GitHub-specific details (rate limit headers, error messages) in the FacetError cause

**client.ts**: Thin Octokit wrapper:
- `GitHubClient` class wrapping `Octokit` instance
- Methods mirror GitHub REST API endpoints: `getIssue`, `createIssue`, `updateIssue`, `listIssues`, `createComment`, `addLabels`
- Handles `owner` and `repo` scoping
- Wraps all API calls with `mapGitHubError` for consistent error handling

**mappers.ts**: Data transformation functions:
- `mapToGitHubIssue(data: OctokitIssueResponse): GitHubIssue` — maps Octokit response to domain type
- `mapToComment(data: OctokitCommentResponse): Comment` — maps comment response
- `mapIssuesToPaginatedResult(data, total): PaginatedResult<Issue>` — wraps list results
- Handles date parsing, label extraction, milestone/reaction mapping

**plugin.ts**: Main plugin class:
- `GitHubIssuesPlugin extends AbstractIssueTrackerPlugin`
- Constructor takes `GitHubConfig { token, owner, repo, cacheTimeout? }`
- Implements all five abstract methods:
  - `fetchIssue(id)` — parses numeric ID, calls client, maps response
  - `doCreateIssue(spec)` — creates via client, maps response
  - `doUpdateIssue(id, update)` — updates via client, maps response
  - `doListIssues(query)` — lists with pagination, maps results
  - `doAddComment(issueId, comment)` — creates comment, maps response
- Additional GitHub-specific methods:
  - `linkPullRequest(issueId, prNumber)` — adds cross-reference comment
  - `addLabels(issueId, labels)` — adds labels via API, returns updated issue

### Phase 3: Testing

**Interface tests**: Unit tests for type guards and helpers:
- `isGitHubIssue` correctly identifies GitHubIssue vs plain Issue
- `parseGitHubIssueRef` handles valid refs, invalid formats, edge cases
- `getGitHubIssueUrl` returns the htmlUrl

**Plugin tests**: Integration tests with mocked Octokit:
- Mock `@octokit/rest` at the module level using `vi.mock`
- Test each of the five abstract method implementations
- Test error mapping (404 → NOT_FOUND, 401 → AUTH_ERROR, etc.)
- Test GitHub-specific methods (linkPullRequest, addLabels)
- Test mapper functions with realistic Octokit response shapes

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Error handling | Map to `FacetError` codes | Consistent with ecosystem; no GitHub-specific error classes |
| Octokit wrapping | Thin client class | Isolates API calls; simplifies mocking in tests |
| PR linking | Comment-based | GitHub auto-renders cross-references; no API endpoint exists |
| Interface deps | Zero runtime deps | Consumers shouldn't need `@octokit/rest` for type checking |
| GitHubIssueSpec | In interface package | Follows Plugin + Interface Pattern from clarifications |
| ID format | String (numeric) | AbstractIssueTrackerPlugin uses string IDs; parse to number for API |

## Dependencies

### github-issues-interface
```json
{
  "dependencies": {
    "@generacy-ai/latency": "workspace:*"
  }
}
```

### latency-plugin-github-issues
```json
{
  "dependencies": {
    "@generacy-ai/latency": "workspace:*",
    "@generacy-ai/latency-plugin-issue-tracker": "workspace:*",
    "@generacy-ai/github-issues-interface": "workspace:*",
    "@octokit/rest": "^21.0.0"
  }
}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Octokit response shape changes | Pin `@octokit/rest` major version; typed mappers catch shape mismatches at compile time |
| Rate limiting in production | Map 429 to `RATE_LIMIT` FacetError; callers can implement retry logic |
| AbstractIssueTrackerPlugin API changes (issue #6 WIP) | Build against current workspace version; update if interface changes |

---

*Generated by speckit*
