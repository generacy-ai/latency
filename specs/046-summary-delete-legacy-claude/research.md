# Research: Remove legacy .claude/autodev.json

## Technology Decisions

### Decision: Simple `git rm` deletion

**Rationale**: The file is a tracked git file with no dependencies. `git rm` is the standard, atomic way to remove it — stages the deletion and removes the working copy in one step.

**Alternatives considered**:
- Manual `rm` + `git add`: Equivalent outcome but two steps instead of one
- Keeping the file with a deprecation notice: Unnecessary since the migration is complete

### Decision: Let `.claude/` directory disappear

**Rationale**: Git does not track empty directories. After removing the only file in `.claude/`, the directory naturally ceases to exist in the repository. This is clean and conventional.

**Alternatives considered**:
- Adding `.gitkeep`: Adds unnecessary clutter for a directory with no planned future use
- Preserving with a README: Over-engineering for a single-file deletion

## Implementation Pattern

This is a straightforward legacy cleanup — no code changes, no migration logic. The pattern is:

1. Verify no references exist (confirmed via grep)
2. Delete the file
3. Verify build integrity
4. Commit

## Key References

- Migration effort: generacy-ai/generacy#373
- New config location: `.generacy/config.yaml` (managed by generacy tooling)
- Original file contents: default config with `paths.specs: "specs"` and `stateProvider.type: "github-labels"`
