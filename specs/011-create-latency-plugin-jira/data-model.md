# Data Model: latency-plugin-jira + jira-interface

## Core Entities

### JiraIssue (extends Issue)

The primary domain entity. Extends the base `Issue` interface from `@generacy-ai/latency` with Jira-specific fields.

```typescript
interface JiraIssue extends Issue {
  // Inherited from Issue:
  // id: string           — Jira issue ID (numeric string)
  // title: string        — maps from fields.summary
  // body: string         — maps from fields.description (wiki markup)
  // state: 'open' | 'closed' — derived from status category
  // labels: string[]     — maps from fields.labels
  // assignees: string[]  — maps from fields.assignee (single → array)
  // createdAt: Date      — maps from fields.created
  // updatedAt: Date      — maps from fields.updated

  // Jira-specific:
  key: string;              // e.g., "PROJ-123"
  projectKey: string;       // e.g., "PROJ"
  issueType: string;        // e.g., "Bug", "Story", "Task", "Epic"
  priority: string;         // e.g., "Highest", "High", "Medium", "Low", "Lowest"
  status: JiraStatus;       // Full status object
  sprint?: JiraSprint;      // Active sprint (if assigned)
  storyPoints?: number;     // Story point estimate
  epicLink?: string;        // Parent epic key
  customFields: Record<string, unknown>;  // Arbitrary custom fields
}
```

### JiraIssueSpec (extends IssueSpec)

Creation specification for new Jira issues.

```typescript
interface JiraIssueSpec extends IssueSpec {
  // Inherited from IssueSpec:
  // title: string        — required
  // body?: string
  // labels?: string[]
  // assignees?: string[]

  // Jira-specific:
  projectKey: string;       // Required: target project
  issueType: string;        // Required: e.g., "Task"
  priority?: string;        // Optional: defaults to project default
  storyPoints?: number;     // Optional
  epicLink?: string;        // Optional: parent epic key
  customFields?: Record<string, unknown>;  // Optional
}
```

### JiraStatus

```typescript
interface JiraStatus {
  id: string;               // Numeric status ID
  name: string;             // Display name, e.g., "In Progress"
  category: string;         // Status category: "new", "indeterminate", "done"
}
```

### JiraSprint

```typescript
interface JiraSprint {
  id: number;               // Sprint ID
  name: string;             // Sprint name
  state: string;            // "active", "closed", "future"
  startDate?: string;       // ISO 8601 date string
  endDate?: string;         // ISO 8601 date string
}
```

### JiraTransition

```typescript
interface JiraTransition {
  id: string;               // Transition ID
  name: string;             // Transition name, e.g., "Start Progress"
  to: JiraStatus;           // Target status after transition
}
```

### JiraIssueLink

```typescript
interface JiraIssueLink {
  id: string;               // Link ID
  type: string;             // Link type name, e.g., "Blocks", "Relates"
  inwardIssue?: string;     // Inward issue key
  outwardIssue?: string;    // Outward issue key
}
```

## Type Guards

```typescript
function isJiraIssue(issue: Issue): issue is JiraIssue
```
Checks for the presence of `key` (string) and `projectKey` (string) properties.

## Helpers

```typescript
function getJiraIssueUrl(issue: JiraIssue, baseUrl: string): string
```
Returns `{baseUrl}/browse/{issue.key}` with proper URL handling.

## HTTP Adapter Interface

```typescript
interface JiraHttpAdapter {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}
```

Paths are relative to the Jira instance base URL (e.g., `/rest/api/2/issue/PROJ-123`). The adapter implementation is responsible for:
- Base URL prefixing
- Authentication headers
- Error handling / retry logic
- Response JSON parsing

## Plugin Options

```typescript
interface JiraPluginOptions extends AbstractIssueTrackerOptions {
  // Inherited: cacheTimeout?: number (default 60000ms)
  http: JiraHttpAdapter;        // Required: injected HTTP adapter
  projectKey?: string;          // Optional: default project for issue creation
}
```

## Relationships

```
@generacy-ai/latency
  └─ Issue, IssueSpec, IssueUpdate, IssueQuery, Comment, PaginatedResult
       │
       ├─ @generacy-ai/jira-interface (extends types)
       │    └─ JiraIssue, JiraIssueSpec, JiraStatus, JiraSprint, JiraTransition
       │
       └─ @generacy-ai/latency-plugin-issue-tracker (abstract impl)
            │
            └─ @generacy-ai/latency-plugin-jira (concrete impl)
                 └─ depends on both jira-interface + issue-tracker
```

## Response Mapping (Jira REST API v2 → JiraIssue)

| JiraIssue Field | Jira API v2 Path |
|-----------------|-------------------|
| `id` | `id` |
| `key` | `key` |
| `title` | `fields.summary` |
| `body` | `fields.description` |
| `state` | Derived: `fields.status.statusCategory.key === 'done'` → `'closed'`, else `'open'` |
| `labels` | `fields.labels` |
| `assignees` | `[fields.assignee?.name]` (filtered nulls) |
| `createdAt` | `new Date(fields.created)` |
| `updatedAt` | `new Date(fields.updated)` |
| `projectKey` | `fields.project.key` |
| `issueType` | `fields.issuetype.name` |
| `priority` | `fields.priority.name` |
| `status` | `{ id: fields.status.id, name: fields.status.name, category: fields.status.statusCategory.key }` |
| `sprint` | `fields.sprint` (may be null) |
| `storyPoints` | `fields.story_points` or `fields.customfield_10016` |
| `epicLink` | `fields.customfield_10014` or `fields.parent?.key` |
| `customFields` | All `fields.customfield_*` entries |

---

*Generated by speckit*
