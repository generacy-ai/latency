# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 21:16

### Q1: GitHubIssueSpec definition
**Context**: The plugin imports `GitHubIssueSpec` from the interface package, but it is never defined in the interface package types. The abstract class requires `doCreateIssue(spec: IssueSpec)` — so we need to know if a GitHub-specific spec type is needed.
**Question**: Should a `GitHubIssueSpec` interface extending `IssueSpec` be defined in the interface package (e.g., adding `milestone`, `project`, `labels` fields), or should the plugin just use the base `IssueSpec` from latency core?
**Options**:
- A: Define `GitHubIssueSpec extends IssueSpec` with GitHub-specific fields (milestone, project, etc.)
- B: Use base `IssueSpec` only — remove the `GitHubIssueSpec` import from the plugin code

**Answer**: **A** - Define `GitHubIssueSpec extends IssueSpec` with GitHub-specific fields (milestone, project, labels). This follows the Plugin + Interface Pattern where the interface package contains extended types. `GitHubIssue extends Issue` is already shown as the canonical example — `GitHubIssueSpec extends IssueSpec` follows the same pattern.

### Q2: Missing abstract method implementations
**Context**: AbstractIssueTrackerPlugin requires five abstract methods: `fetchIssue`, `doCreateIssue`, `doUpdateIssue`, `doListIssues`, and `doAddComment`. The spec only shows `fetchIssue`. All five must be implemented for the plugin to compile.
**Question**: Should all five abstract methods be implemented with full GitHub API integration, or should some be stubbed with `throw new Error('Not implemented')` for a future phase?
**Options**:
- A: Implement all five methods with full Octokit API calls
- B: Implement `fetchIssue` and `doListIssues` now; stub the rest for a later phase

**Answer**: **A** - Implement all five abstract methods with full GitHub API integration. The acceptance criteria state "All IssueTracker methods work with GitHub API." This is a complete, working implementation of the abstract plugin — stubbing methods would leave consumers with a partially functional facet.

### Q3: linkPullRequest implementation
**Context**: GitHub's REST API doesn't have a direct 'link PR to issue' endpoint. PRs are linked by including 'Closes #N' in the PR body, or via the GraphQL API's timeline events. The spec shows `linkPullRequest` as a method but doesn't specify how it should work.
**Question**: How should `linkPullRequest` be implemented?
**Options**:
- A: Add a comment on the issue referencing the PR (e.g., 'Linked to #PR')
- B: Update the PR body to include 'Closes #issue' keyword
- C: Use GitHub GraphQL API to create a cross-reference
- D: Remove this method — it's not feasible via the REST API

**Answer**: **A** - Add a comment on the issue referencing the PR. GitHub automatically renders cross-references when issues and PRs mention each other, creating a visible, bidirectional reference without requiring GraphQL dependencies or mutating PR bodies.

### Q4: Error handling strategy
**Context**: The abstract plugin uses `FacetError` with error codes. GitHub API calls can fail with rate limits (403), not found (404), auth errors (401), and validation errors (422). The spec doesn't specify how these should be mapped.
**Question**: Should GitHub API errors be wrapped into specific error subclasses (e.g., `GitHubRateLimitError`, `GitHubNotFoundError`) or mapped to generic `FacetError` codes?
**Options**:
- A: Create GitHub-specific error classes extending `FacetError` with codes like 'GITHUB_RATE_LIMIT', 'GITHUB_NOT_FOUND'
- B: Map to generic `FacetError` codes ('NOT_FOUND', 'AUTH_ERROR', 'RATE_LIMIT') without GitHub-specific classes

**Answer**: **B** - Map to generic `FacetError` codes (NOT_FOUND, AUTH_ERROR, RATE_LIMIT) without GitHub-specific error classes. This aligns with Latency's two-way uncoupling philosophy. GitHub-specific details (like remaining rate limit headers) can be included in the error's `context` or `details` field.

