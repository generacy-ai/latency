# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 21:16

### Q1: Method Signature Alignment
**Context**: The spec shows `doCommit(message: string, files: string[])` but the actual AbstractSourceControlPlugin uses `doCommit(spec: CommitSpec)`. The abstract class also has additional abstract methods (doPush, doPull, doCheckout, doGetStatus) not shown in the spec. Implementing against the wrong signatures would cause compile errors.
**Question**: Should the GitPlugin implementation follow the actual AbstractSourceControlPlugin signatures (doCommit(spec: CommitSpec), doPush, doPull, doCheckout, doGetStatus) rather than the signatures shown in the issue description?
**Options**:
- A: Follow actual AbstractSourceControlPlugin signatures (recommended — ensures compatibility)
- B: Follow issue description signatures and update AbstractSourceControlPlugin to match

**Answer**: *Pending*

### Q2: Type Overlap: GitCommit.sha
**Context**: The core Commit interface already has a `sha` field. The spec's GitCommit also declares `sha: string`, which would be redundant. The spec also adds `shortSha`, `tree`, and `parents` which are genuinely git-specific.
**Question**: Since Commit already has `sha`, should GitCommit omit the duplicate `sha` field and only add the genuinely new fields (shortSha, tree, parents)?
**Options**:
- A: Omit duplicate sha, only add shortSha, tree, parents (cleaner, no shadowing)
- B: Keep sha in GitCommit as declared (matches issue description literally)

**Answer**: *Pending*

### Q3: DiffEntry vs FileChange
**Context**: The spec imports `FileChange` from `@generacy-ai/latency`, but the actual core package defines `DiffEntry` (with path, status, additions, deletions). There is no `FileChange` type. Using the wrong type name will cause import failures.
**Question**: Should git-interface import and use `DiffEntry` from `@generacy-ai/latency` instead of the non-existent `FileChange`?
**Options**:
- A: Use DiffEntry (matches actual codebase)
- B: Create a FileChange type alias for DiffEntry for git-interface consumers

**Answer**: *Pending*

### Q4: Git-Specific Methods Scope
**Context**: The spec lists git-specific methods (stash, stashPop, rebase, cherryPick, blame) that are not part of the SourceControl facet interface. These extend beyond what AbstractSourceControlPlugin requires. It's unclear whether these should be in the initial implementation or deferred.
**Question**: Should the initial implementation include all git-specific methods (stash, rebase, cherryPick, blame), or focus on implementing the core SourceControl interface first and add git-specific methods in a follow-up?
**Options**:
- A: Implement core SourceControl interface only (all do* abstract methods) — defer git-specific methods
- B: Implement everything listed in the spec including git-specific methods
- C: Implement core SourceControl + just blame (most useful for latency tracking), defer stash/rebase/cherryPick

**Answer**: *Pending*

### Q5: Package Naming Convention
**Context**: The spec names the interface package `git-interface` (as `@generacy-ai/git-interface`), which breaks the `latency-*` naming pattern used by other packages (latency-plugin-source-control, latency-plugin-issue-tracker). This could cause confusion in the monorepo.
**Question**: Should the interface package follow the monorepo naming convention as `@generacy-ai/latency-git-interface` or use `@generacy-ai/git-interface` as specified?
**Options**:
- A: Use @generacy-ai/latency-git-interface (consistent with monorepo conventions)
- B: Use @generacy-ai/git-interface as specified in the issue

**Answer**: *Pending*

