# Tasks: Prepare Repository for Public Visibility

**Input**: Design documents from `specs/036-prepare-repository-public/`
**Prerequisites**: plan.md (required), spec.md (required)
**Status**: Ready

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: LICENSE File and package.json Updates

### T001 [DONE] Create LICENSE file at repo root
**File**: `LICENSE`
- Create `LICENSE` file with the full Apache License 2.0 text
- Copyright line: `Copyright 2026 The Generacy AI Authors`
- Use the standard text from https://www.apache.org/licenses/LICENSE-2.0

### T002 [DONE] [P] Add `"license": "Apache-2.0"` to root package.json
**File**: `package.json`
- Add `"license": "Apache-2.0"` field after the `"name"` field
- Use the SPDX identifier `Apache-2.0`

### T003 [DONE] [P] Add `"license": "Apache-2.0"` to all 16 package-level package.json files
**Files**:
- `packages/latency/package.json`
- `packages/latency-plugin-dev-agent/package.json`
- `packages/latency-plugin-issue-tracker/package.json`
- `packages/latency-plugin-source-control/package.json`
- `packages/plugin-ci-cd/package.json`
- `packages/latency-plugin-health-check/package.json`
- `packages/latency-plugin-github-issues/package.json`
- `packages/latency-plugin-github-actions/package.json`
- `packages/github-issues-interface/package.json`
- `packages/github-actions-interface/package.json`
- `packages/latency-plugin-git/package.json`
- `packages/git-interface/package.json`
- `packages/latency-plugin-jira/package.json`
- `packages/jira-interface/package.json`
- `packages/latency-plugin-claude-code/package.json`
- `packages/claude-code-interface/package.json`
- Add `"license": "Apache-2.0"` to each file using SPDX identifier

### T004 [DONE] Verify Phase 1 artifacts
- Confirm `LICENSE` file exists and contains "Apache License" and "2026 The Generacy AI Authors"
- Confirm all 17 `package.json` files contain `"license": "Apache-2.0"`

---

## Phase 2: SECURITY.md

### T005 [DONE] Create SECURITY.md at repo root
**File**: `SECURITY.md`
- **Supported Versions**: State that the project is pre-1.0; security fixes apply only to the latest release on the main branch
- **Reporting a Vulnerability**: Primary channel is GitHub Security Advisories; fallback email `security@generacy.ai`
- **Response Timeline**: Acknowledgment within 5 business days; best-effort fix timeline
- **Disclosure Policy**: Coordinated disclosure; reporters asked to allow reasonable time for fixes
- **Scope**: In scope — code in this repository, published npm packages; out of scope — third-party dependencies, GitHub infrastructure

### T006 [DONE] Verify SECURITY.md
- Confirm file exists at repo root
- Confirm it contains: "pre-1.0", "security@generacy.ai", "5 business days"

---

## Phase 3: .github/CODEOWNERS

### T007 [DONE] Create .github/CODEOWNERS file
**File**: `.github/CODEOWNERS`
- Create `.github/` directory if it does not exist
- Add single default owner rule: `* @generacy-ai/core-team`
- Include a comment header explaining the file

### T008 [DONE] Validate CODEOWNERS team existence
- Run `gh api orgs/generacy-ai/teams/core-team` to verify the team exists
- If the team does not exist, document the fallback plan (create team or substitute valid usernames)

---

## Phase 4: Secrets Audit with gitleaks

### T009 [DONE] Install gitleaks
- Install gitleaks via binary download or package manager
- Verify installation with `gitleaks version`

### T010 [DONE] Create .gitleaks.toml configuration
**File**: `.gitleaks.toml`
- Create baseline gitleaks configuration at repo root
- Include global allowlist for `pnpm-lock.yaml` and `.gitleaks.toml`
- Keep allowlist minimal; expand during triage (T012)

### T011 [DONE] Run full git history scan
- Execute: `gitleaks detect --source . --verbose --report-format json --report-path gitleaks-report.json`
- This scans all commits in the repository history
- Capture output and exit code

### T012 [DONE] Triage scan findings
- Review each finding from the gitleaks report
- **True positives** (real secrets): Document file, commit, and secret type — flag for maintainer approval before any history rewrite
- **False positives**: Add to `.gitleaks.toml` allowlist as path or fingerprint exclusions

### T013 [DONE] Re-run scan to confirm clean result
- After updating allowlist in `.gitleaks.toml`, re-run gitleaks
- Confirm exit code 0 (no findings)
- If findings remain, repeat triage (T012) until clean

### T014 [DONE] [P] Add `gitleaks-report.json` to .gitignore
**File**: `.gitignore`
- Append `gitleaks-report.json` to the `.gitignore` file
- Ensure the report file itself is not committed

### T015 [DONE] Document audit results
- Record in PR description (not committed to repo):
  - Tool and version used
  - Scan date
  - Number of findings (total, true positive, false positive)
  - Remediation actions taken
  - Clean scan confirmation

---

## Phase 5: Final Verification and PR

### T016 [DONE] Run final verification checklist
- Confirm all new files exist at expected paths:
  - `LICENSE`
  - `SECURITY.md`
  - `.github/CODEOWNERS`
  - `.gitleaks.toml`
- Confirm all 17 `package.json` files contain `"license": "Apache-2.0"`
- Confirm `gitleaks detect` returns clean (exit code 0)
- Confirm `.gitignore` includes `gitleaks-report.json`
- Review `git diff` for unintended changes

### T017 [DONE] Create pull request
- Stage all changes
- Commit with descriptive message
- Push branch to remote
- Create PR against `develop` with:
  - Summary of all changes
  - Secrets audit report (tool, version, date, findings, remediation)
  - Note about CODEOWNERS team validation status
  - Link back to spec (`specs/036-prepare-repository-public/spec.md`)

---

## Dependencies & Execution Order

**Phase dependencies (sequential)**:
- Phase 1 must complete before Phase 5 (final verification)
- Phase 2 must complete before Phase 5
- Phase 3 must complete before Phase 5
- Phase 4 must complete before Phase 5
- Phases 1, 2, and 3 are independent of each other and can run in parallel
- Phase 4 (secrets audit) is independent of Phases 1–3 but produces `.gitleaks.toml` and `.gitignore` changes that must be committed with the rest

**Parallel opportunities within phases**:
- **Phase 1**: T001, T002, and T003 can all run in parallel [P] — they touch different files
- **Phase 4**: T014 (gitignore update) can run in parallel with T011–T013 (scan and triage)

**Task dependencies within Phase 4 (sequential)**:
- T009 (install) → T010 (config) → T011 (scan) → T012 (triage) → T013 (re-scan) → T015 (document)

**Cross-phase parallelism**:
- Phase 1 (T001–T004) | Phase 2 (T005–T006) | Phase 3 (T007–T008) can all run in parallel
- Phase 4 (T009–T015) can run in parallel with Phases 1–3

**Critical path**:
T009 → T010 → T011 → T012 → T013 → T015 → T016 → T017
