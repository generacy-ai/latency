# Tasks: CI/CD for Latency Repo (1.2)

**Input**: Design documents from feature directory
**Prerequisites**: plan.md (required), spec.md (required)
**Status**: Ready

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Fix `publish-preview.yml`

All changes target `.github/workflows/publish-preview.yml`. These must be applied sequentially to the same file.

### T001 Remove `id-token: write` permission from publish-preview.yml
**File**: `.github/workflows/publish-preview.yml`
- Remove `id-token: write` from the `permissions` block (line 11)
- Resulting permissions block should only contain `contents: read`

### T002 Add concurrency group to publish-preview.yml
**File**: `.github/workflows/publish-preview.yml`
- Add `concurrency` block after the `permissions` block
- Use fixed group name `preview-publish` (not branch-scoped, since this only triggers on `develop`)
- Set `cancel-in-progress: true` to prevent duplicate snapshot publishes

### T003 Remove `npm install -g npm@latest` step from publish-preview.yml
**File**: `.github/workflows/publish-preview.yml`
- Remove the entire "Update npm" step (lines 49–51)
- This was a workaround for a provenance bug; pnpm is the package manager

### T004 Remove `--provenance` flag from publish-preview.yml
**File**: `.github/workflows/publish-preview.yml`
- Change `pnpm changeset publish --tag preview --provenance` to `pnpm changeset publish --tag preview`
- OIDC/provenance is out of scope per spec

---

## Phase 2: Fix `release.yml`

All changes target `.github/workflows/release.yml`. These must be applied sequentially to the same file. Phase 2 can run in **parallel** with Phase 1 (different files).

### T005 [P] Remove `id-token: write` permission from release.yml
**File**: `.github/workflows/release.yml`
- Remove `id-token: write` from the `permissions` block (line 14)
- Resulting permissions block should contain `contents: write` and `pull-requests: write`

### T006 Add `registry-url` to setup-node in release.yml
**File**: `.github/workflows/release.yml`
- Add `registry-url: https://registry.npmjs.org` to the `actions/setup-node@v4` step
- This causes `setup-node` to auto-create `.npmrc` with `NODE_AUTH_TOKEN` reference

### T007 Remove `npm install -g npm@latest` step from release.yml
**File**: `.github/workflows/release.yml`
- Remove the bare `run: npm install -g npm@latest` step (line 34)
- Same rationale as T003: pnpm is the package manager

### T008 Add `NODE_AUTH_TOKEN` env var to changesets/action step in release.yml
**File**: `.github/workflows/release.yml`
- Add `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` to the `env` block of the "Create Release PR or Publish" step
- Keep existing `NPM_TOKEN` for backwards compatibility with changesets action internals
- `NODE_AUTH_TOKEN` is what the `.npmrc` (created by `setup-node` with `registry-url`) reads

---

## Phase 3: Verify `ci.yml` (no changes expected)

### T009 [P] Verify ci.yml matches spec
**File**: `.github/workflows/ci.yml`
- Confirm triggers: `pull_request` (all branches) and `push` to `develop`/`main`
- Confirm concurrency group with `cancel-in-progress: true`
- Confirm steps: checkout → setup pnpm → setup node → install → build → lint → test
- Confirm no provenance, no npm update, no registry-url (not needed for CI-only)
- **Expected result**: No changes required

---

## Phase 4: Verify `.changeset/config.json` (no changes expected)

### T010 [P] Verify changeset config matches spec
**File**: `.changeset/config.json`
- Confirm `baseBranch: "develop"`
- Confirm `access: "public"`
- Confirm `updateInternalDependencies: "patch"`
- Confirm `commit: false`
- **Expected result**: No changes required

---

## Phase 5: Validation & PR

### T011 Validate workflow YAML syntax
**Files**:
- `.github/workflows/publish-preview.yml`
- `.github/workflows/release.yml`
- Run `yamllint` or equivalent check on modified workflow files
- Verify no YAML indentation or structural errors were introduced

### T012 Write PR description with branch protection verification checklist
**File**: PR description (not a repo file)
- Include post-merge verification commands for branch protection rules:
  ```
  gh api repos/{owner}/{repo}/branches/develop/protection --jq '.required_status_checks.contexts'
  gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts'
  ```
- Expected result: should include "Build, Lint, Test" (the CI job name)
- Document all changes made with references to clarification questions Q1–Q12

---

## Dependencies & Execution Order

**Phase dependencies (sequential)**:
- Phase 1 (T001–T004) and Phase 2 (T005–T008) are **independent** (different files) and can run in parallel
- Phase 3 (T009) and Phase 4 (T010) are **independent** verification-only tasks, can run in parallel with each other and with Phases 1–2
- Phase 5 (T011–T012) depends on Phases 1–2 completing

**Parallel opportunities within phases**:
- T005–T008 can run in parallel with T001–T004 (different files)
- T009 and T010 can run in parallel with all other tasks (read-only verification)

**Within-file sequential constraints**:
- T001 → T002 → T003 → T004 (all modify `publish-preview.yml`)
- T005 → T006 → T007 → T008 (all modify `release.yml`)

**Critical path**:
T001 → T002 → T003 → T004 → T011 → T012

**Alternate parallel path**:
T005 → T006 → T007 → T008 ─┐
T009 (verify ci.yml) ───────┤
T010 (verify config.json) ──┴→ T011 → T012
