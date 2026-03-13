# Implementation Plan: Remove legacy .claude/autodev.json

**Feature**: Delete the legacy `.claude/autodev.json` configuration file
**Branch**: `046-summary-delete-legacy-claude`
**Status**: Complete

## Summary

Delete `.claude/autodev.json` from the repository. This file contains default configuration (`paths.specs: "specs"`) that has been superseded by `.generacy/config.yaml` as part of the migration tracked in generacy-ai/generacy#373. Since `autodev.json` is the only file in `.claude/`, the directory will naturally disappear from git tracking after deletion.

## Technical Context

- **Language/Framework**: N/A (file deletion only)
- **Dependencies**: None
- **Build Impact**: None — no code reads this file at runtime or build time
- **CI Impact**: None expected — build and tests should remain green

## Clarification Resolution

- **Q1 (Empty .claude/ directory)**: The clarification confirmed `.claude/` contains only `autodev.json`. Per the answer, we let the directory disappear naturally (Option A) — no `.gitkeep` needed. AC-3 from the spec ("preserve .claude/ directory") is effectively moot since its premise was incorrect.

## Project Structure

Files affected:

```
.claude/autodev.json          # DELETE — legacy config, superseded by .generacy/config.yaml
```

No other files need modification. The only references to `autodev.json` are in the spec files themselves (`spec.md`, `clarifications.md`), which are documentation of this change.

## Implementation Steps

### Step 1: Delete the file

- Run `git rm .claude/autodev.json`
- This stages the deletion and removes the file from the working tree
- The `.claude/` directory will be automatically removed since it becomes empty

### Step 2: Verify no breakage

- Run `pnpm build` to confirm the build still passes
- Run `pnpm test` (if tests exist) to confirm no test failures
- Verify no remaining runtime/build references to the file

### Step 3: Commit and push

- Commit with a clear message referencing the issue
- Push to the feature branch

## Risk Assessment

**Risk**: Extremely low. The file contains only default configuration values. A grep of the codebase confirms no code references `autodev.json`. The configuration it provided (`paths.specs: "specs"`) is handled by `.generacy/config.yaml` in the generacy tooling.

## Success Criteria

| ID | Metric | Verification |
|----|--------|-------------|
| SC-001 | File removed | `.claude/autodev.json` no longer in repo |
| SC-002 | No breakage | Build passes after removal |
