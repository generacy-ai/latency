# Implementation Plan: Create latency-plugin-jira + interface

**Feature**: Jira issue tracker plugin and type-only interface package for the Latency ecosystem
**Branch**: `011-create-latency-plugin-jira`
**Status**: Complete

## Summary

Create two new packages in the Latency monorepo:

1. **`@generacy-ai/jira-interface`** — Types-only package defining Jira-specific data structures (`JiraIssue`, `JiraTransition`, `JiraSprint`, etc.) and helper functions (`isJiraIssue`, `getJiraIssueUrl`). Zero runtime dependencies beyond `@generacy-ai/latency` types.

2. **`@generacy-ai/latency-plugin-jira`** — Concrete implementation of `AbstractIssueTrackerPlugin` for Jira. Implements all abstract `do*` methods against the Jira REST API v2, plus Jira-specific methods (`transitionIssue`, `getTransitions`, `linkIssues`).

## Technical Context

- **Language**: TypeScript 5.4, ES2022 target, NodeNext modules
- **Build**: `tsc` (no bundler)
- **Test Framework**: Vitest 3.0
- **Monorepo**: pnpm workspaces (`packages/*`)
- **Base Class**: `AbstractIssueTrackerPlugin` from `@generacy-ai/latency-plugin-issue-tracker`
- **Core Types**: `Issue`, `IssueSpec`, `IssueUpdate`, `IssueQuery`, `Comment`, `PaginatedResult` from `@generacy-ai/latency`

## Design Decisions

These decisions resolve the unanswered clarification questions using the most pragmatic defaults:

| # | Topic | Decision | Rationale |
|---|-------|----------|-----------|
| Q1 | API Client | Injectable HTTP adapter interface | Keeps the plugin decoupled from any specific HTTP library; consumers provide their own client |
| Q2 | Authentication | Accept pre-configured HTTP client | Auth is consumer's responsibility; plugin just calls endpoints |
| Q3 | API Version | v2 (wiki markup) | Broader compatibility (Cloud + Server/DC), simpler text handling |
| Q4 | Package Location | `packages/jira-interface/` (flat) | Consistent with existing `packages/*` naming convention |
| Q5 | Type Scope | Open string types | Maximally flexible for custom Jira configurations; no enum maintenance burden |

## Project Structure

```
packages/
├── jira-interface/                          # NEW: Types-only package
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                         # Re-exports all types and helpers
│       ├── types.ts                         # JiraIssue, JiraIssueType, JiraPriority, etc.
│       ├── guards.ts                        # isJiraIssue type guard
│       └── helpers.ts                       # getJiraIssueUrl utility
│
├── latency-plugin-jira/                     # NEW: Plugin implementation
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── index.ts                         # Re-exports plugin, types, errors
│   │   ├── jira-plugin.ts                   # JiraPlugin class extending abstract
│   │   ├── http-adapter.ts                  # JiraHttpAdapter interface
│   │   └── mapper.ts                        # Maps Jira REST API responses to JiraIssue
│   └── __tests__/
│       ├── jira-plugin.test.ts              # Plugin unit tests (mocked HTTP)
│       └── mapper.test.ts                   # Response mapper tests
```

## File Specifications

### Package: `@generacy-ai/jira-interface`

#### `src/types.ts`
Defines all Jira-specific types extending the core `Issue` interface:
- `JiraIssue` — extends `Issue` with `key`, `projectKey`, `issueType`, `priority`, `status`, `sprint?`, `storyPoints?`, `epicLink?`, `customFields`
- `JiraIssueSpec` — extends `IssueSpec` with Jira-specific creation fields (`projectKey`, `issueType`, `priority?`, `storyPoints?`, `epicLink?`, `customFields?`)
- `JiraIssueType` — string type alias (e.g., `'Bug'`, `'Story'`, `'Task'`, `'Epic'`)
- `JiraPriority` — string type alias
- `JiraStatus` — `{ id: string; name: string; category: string }`
- `JiraSprint` — `{ id: number; name: string; state: string; startDate?: string; endDate?: string }`
- `JiraTransition` — `{ id: string; name: string; to: JiraStatus }`
- `JiraIssueLink` — `{ id: string; type: string; inwardIssue?: string; outwardIssue?: string }`

All string-based identifiers use plain `string` type for maximum flexibility with custom Jira configurations.

#### `src/guards.ts`
- `isJiraIssue(issue: Issue): issue is JiraIssue` — checks for `key` and `projectKey` properties

#### `src/helpers.ts`
- `getJiraIssueUrl(issue: JiraIssue, baseUrl: string): string` — constructs browsable URL from base URL and issue key

#### `src/index.ts`
Re-exports everything from `types.ts`, `guards.ts`, and `helpers.ts`.

### Package: `@generacy-ai/latency-plugin-jira`

#### `src/http-adapter.ts`
Defines the injectable HTTP adapter interface:
```typescript
interface JiraHttpAdapter {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}
```
Also defines `JiraPluginOptions` extending `AbstractIssueTrackerOptions`:
- `http: JiraHttpAdapter` — required injectable HTTP adapter
- `projectKey?: string` — default project key for issue creation

#### `src/mapper.ts`
Maps raw Jira REST API v2 JSON responses to `JiraIssue` objects:
- `mapJiraResponse(raw: unknown): JiraIssue` — main mapper
- `mapJiraComment(raw: unknown): Comment` — comment mapper
- Handles field extraction: `key`, `fields.project.key`, `fields.issuetype.name`, `fields.priority.name`, `fields.status`, `fields.sprint`, `fields.story_points`, `fields.customfield_*`

#### `src/jira-plugin.ts`
`JiraPlugin extends AbstractIssueTrackerPlugin`:

**Abstract method implementations:**
- `fetchIssue(id)` — `GET /rest/api/2/issue/{id}`
- `doCreateIssue(spec)` — `POST /rest/api/2/issue` (maps `IssueSpec` → Jira create payload)
- `doUpdateIssue(id, update)` — `PUT /rest/api/2/issue/{id}` (maps `IssueUpdate` → Jira update payload)
- `doListIssues(query)` — `GET /rest/api/2/search` with JQL built from `IssueQuery`
- `doAddComment(issueId, comment)` — `POST /rest/api/2/issue/{issueId}/comment`

**Jira-specific public methods:**
- `transitionIssue(issueId, transition)` — `POST /rest/api/2/issue/{issueId}/transitions`
- `getTransitions(issueId)` — `GET /rest/api/2/issue/{issueId}/transitions`
- `linkIssues(fromId, toId, linkType)` — `POST /rest/api/2/issueLink`

**Validation overrides:**
- `validateIssueSpec(spec)` — calls `super`, then validates `projectKey` on `JiraIssueSpec`

#### `src/index.ts`
Re-exports `JiraPlugin`, `JiraPluginOptions`, `JiraHttpAdapter`, and re-exports all types from `@generacy-ai/jira-interface`.

### Tests

#### `__tests__/jira-plugin.test.ts`
- Mock `JiraHttpAdapter` implementation using `vi.fn()`
- Test all 5 abstract method implementations (fetchIssue, doCreateIssue, doUpdateIssue, doListIssues, doAddComment)
- Test Jira-specific methods (transitionIssue, getTransitions, linkIssues)
- Test validation (JiraIssueSpec with missing projectKey)
- Test JQL query building from IssueQuery
- Follows existing test patterns from `abstract-plugin.test.ts`

#### `__tests__/mapper.test.ts`
- Test mapping raw Jira JSON → `JiraIssue`
- Test edge cases (missing optional fields, custom fields)
- Test comment mapping

## Dependencies

### `@generacy-ai/jira-interface`
```json
{
  "dependencies": {
    "@generacy-ai/latency": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.14.0"
  }
}
```

### `@generacy-ai/latency-plugin-jira`
```json
{
  "dependencies": {
    "@generacy-ai/latency": "workspace:*",
    "@generacy-ai/latency-plugin-issue-tracker": "workspace:*",
    "@generacy-ai/jira-interface": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.14.0",
    "vitest": "^3.0.0"
  }
}
```

No external HTTP client dependency — the injectable adapter pattern means consumers bring their own.

## Implementation Order

1. Create `jira-interface` package (types first, no implementation dependency)
2. Create `latency-plugin-jira` package scaffolding
3. Implement HTTP adapter interface and mapper
4. Implement `JiraPlugin` class
5. Write tests
6. Verify build and typecheck across monorepo

---

*Generated by speckit*
