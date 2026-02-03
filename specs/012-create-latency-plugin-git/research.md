# Research: latency-plugin-git + git-interface

## Technology Decisions

### simple-git library

**Choice**: `simple-git` ^3.27.0
**Rationale**: Specified in the issue. Mature, well-maintained Node.js wrapper for the git CLI. Provides typed responses and handles spawning git processes.

**Alternatives considered**:
- `isomorphic-git` — Pure JS git implementation, no CLI dependency. Rejected: heavier, slower for local ops, and the spec explicitly calls for simple-git.
- `nodegit` — Native bindings to libgit2. Rejected: native dependency complications, less maintainable.
- Direct `child_process` — Lower level. Rejected: simple-git already provides this with typed responses and error handling.

### Package naming

**Choice**: `@generacy-ai/git-interface` (directory: `packages/git-interface`)
**Rationale**: Follows existing convention. Other interface packages use `{provider}-interface` naming (e.g., `github-issues-interface`, `jira-interface`, `claude-code-interface`).

### Type extension strategy

**Choice**: Extend core types, don't shadow existing fields
**Rationale**: `Commit.sha` already exists in the core interface. Adding `sha` again in `GitCommit` would shadow the parent field. Only genuinely new fields (`shortSha`, `tree`, `parents`) are added.

## Implementation Patterns

### Template Method (inherited from AbstractSourceControlPlugin)

The abstract base class validates inputs in public methods and delegates to protected `do*` methods. GitPlugin implements these `do*` methods with simple-git calls wrapped through `GitClient`.

### Client wrapper pattern

Following `latency-plugin-github-issues/client.ts`, the `GitClient` class wraps `simple-git` to:
1. Centralize simple-git initialization
2. Provide a consistent error boundary
3. Make testing easier (mock GitClient instead of simple-git internals)

### Error mapping pattern

Following `latency-plugin-github-issues/errors.ts`, git errors are mapped to `FacetError` with semantic codes. Git error messages are pattern-matched to determine the appropriate error code.

### Mapper pattern

Following `latency-plugin-github-issues/mappers.ts`, all simple-git response types are mapped to domain types through pure functions. This isolates the plugin from simple-git's internal type changes.

## Key Sources

- [simple-git API documentation](https://github.com/steveukx/git-js)
- Existing codebase patterns in `latency-plugin-github-issues` and `github-issues-interface`
- `AbstractSourceControlPlugin` contract in `latency-plugin-source-control`
