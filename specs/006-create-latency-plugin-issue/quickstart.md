# Quickstart: latency-plugin-issue-tracker

## Installation

```bash
# From monorepo root
pnpm install
pnpm build
```

The package is available as `@generacy-ai/latency-plugin-issue-tracker` within the workspace.

## Usage

### Extending the Abstract Plugin

```typescript
import { AbstractIssueTrackerPlugin } from '@generacy-ai/latency-plugin-issue-tracker';
import type { Issue, IssueSpec, IssueUpdate, IssueQuery, Comment, PaginatedResult } from '@generacy-ai/latency';

class MyIssueTracker extends AbstractIssueTrackerPlugin {
  protected async fetchIssue(id: string): Promise<Issue> {
    // Fetch from your service
  }

  protected async doCreateIssue(spec: IssueSpec): Promise<Issue> {
    // Create via your service API
  }

  protected async doUpdateIssue(id: string, update: IssueUpdate): Promise<Issue> {
    // Update via your service API
  }

  protected async doListIssues(query: IssueQuery): Promise<PaginatedResult<Issue>> {
    // List from your service with pagination
  }

  protected async doAddComment(issueId: string, comment: string): Promise<Comment> {
    // Add comment via your service API
  }
}
```

### Configuring Cache TTL

```typescript
const tracker = new MyIssueTracker({ cacheTimeout: 120000 }); // 2 minutes
```

### Handling Errors

```typescript
import { ValidationError } from '@generacy-ai/latency-plugin-issue-tracker';
import { FacetError } from '@generacy-ai/latency';

try {
  await tracker.createIssue({ title: '' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.code); // 'VALIDATION'
  }
  if (error instanceof FacetError) {
    console.log(error.code); // Also works
  }
}
```

### Cache Management

```typescript
tracker.invalidateCache('issue-123'); // Clear one entry
tracker.invalidateCache();            // Clear all entries
```

## Available Commands

```bash
pnpm build        # Compile TypeScript
pnpm typecheck    # Type-check without emitting
pnpm test         # Run Vitest tests
pnpm test:coverage # Run with coverage report
```

## Troubleshooting

**Build fails with missing types**: Ensure `@generacy-ai/latency` is built first (`pnpm -r build` from root).

**Tests fail to find imports**: Check that `vitest.config.ts` exists and the package uses `"type": "module"`.
