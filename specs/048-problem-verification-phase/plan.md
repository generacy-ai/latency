# Implementation Plan: Update workflow verification to use discovery-based validation

**Feature**: Replace hardcoded `pnpm run test`/`pnpm run lint` verification with `build.validate`
**Branch**: `048-problem-verification-phase`
**Status**: Complete

## Summary

Replace the two hardcoded `verification.check` steps in the verification phase of both `.generacy/speckit-feature.yaml` (Phase 7) and `.generacy/speckit-bugfix.yaml` (Phase 6) with a single `build.validate` step. The `build.validate` tool auto-detects the package manager and discovers all available validation scripts, eliminating the pnpm assumption and ensuring comprehensive coverage (e.g., `typecheck` is currently missed).

## Technical Context

- **Language/Format**: YAML workflow definitions
- **Framework**: Generacy workflow engine (speckit)
- **Dependency**: `build.validate` tool (generacy-ai/agency#323)
- **Package Manager**: pnpm (but the change makes this detection automatic)

## Current State

Both workflow files end with a verification phase containing two hardcoded steps:

```yaml
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
```

**Problems**:
1. Hardcodes `pnpm` — breaks for npm/yarn projects
2. Only runs `test` and `lint` — misses `typecheck` (present in this repo's package.json) and potential `format:check`

## Target State

Both workflow files will have their verification phase replaced with:

```yaml
- name: validate
  uses: build.validate
  continueOnError: true
```

## Project Structure — Files to Modify

| File | Change | Phase |
|------|--------|-------|
| `.generacy/speckit-feature.yaml` | Replace Phase 7 (verification) steps | Implementation |
| `.generacy/speckit-bugfix.yaml` | Replace Phase 6 (verification) steps | Implementation |

No new files are created. No files are deleted.

## Implementation Approach

1. **Edit `.generacy/speckit-feature.yaml`**: Remove the two `verification.check` steps in Phase 7 and replace with a single `build.validate` step, preserving `continueOnError: true`
2. **Edit `.generacy/speckit-bugfix.yaml`**: Same change in Phase 6
3. **Verify**: Confirm no remaining hardcoded `pnpm` references in verification phases

## Risk Assessment

- **Low risk**: This is a two-line-equivalent change in two config files
- **Dependency**: Requires `build.validate` tool to be available in the workflow engine (agency#323)
- **Rollback**: Simple git revert if needed

## Constitution Check

No `.specify/memory/constitution.md` found — no governance constraints to verify against.
