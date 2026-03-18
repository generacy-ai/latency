# Research: Discovery-based Validation

## Technology Decision

**Decision**: Use `build.validate` tool instead of manual `verification.check` steps.

**Rationale**: The `build.validate` tool (generacy-ai/agency#323) encapsulates package manager detection and script discovery, making workflows portable across projects regardless of their package manager or configured validation scripts.

## Alternatives Considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| `build.validate` (chosen) | Auto-detects PM, discovers all scripts, single step | External dependency (agency#323) | Best fit — designed for this exact use case |
| Enumerate all known scripts | No external dependency | Still hardcodes PM, must maintain script list | Rejected — doesn't solve the core problem |
| Shell script wrapper | Full control | Duplicates `build.validate` logic, maintenance burden | Rejected — reinvents the wheel |

## Implementation Pattern

The change follows the existing workflow YAML pattern:

```yaml
# Before: two manual steps
- name: run-tests
  uses: verification.check
  with:
    command: pnpm run test
  continueOnError: true
- name: run-lint
  uses: verification.check
  with:
    command: pnpm run lint
  continueOnError: true

# After: single discovery-based step
- name: validate
  uses: build.validate
  continueOnError: true
```

## Key Considerations

- **`continueOnError: true`**: Must be preserved so partial validation failures don't block the workflow
- **No `with` block needed**: `build.validate` handles discovery internally — no parameters required
- **Script coverage**: In this repo, `build.validate` would discover `test`, `lint`, and `typecheck` (all present in root `package.json`), catching the currently-missed `typecheck`
