# Implementation Plan: Prepare Repository for Public Visibility

**Branch**: `036-prepare-repository-public` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/036-prepare-repository-public/spec.md`

## Summary

Add required open-source artifacts (LICENSE, SECURITY.md, CODEOWNERS) and perform a secrets audit before making the `latency` repository publicly visible. This is a non-code feature — no application logic changes, only repository metadata and configuration files. The Apache 2.0 license will be applied, the `license` field added to all 17 package.json files, a gitleaks configuration persisted for ongoing scanning, and the audit results documented in the PR description.

## Technical Context

**Language/Version**: N/A (configuration files, markdown, TOML)
**Primary Dependencies**: `gitleaks` (secrets scanner, installed via binary or package manager)
**Storage**: N/A
**Testing**: Manual verification — file existence, SPDX validity, gitleaks clean scan
**Target Platform**: GitHub (repository metadata recognized by GitHub UI)
**Project Type**: Monorepo (pnpm workspaces, 16 packages under `packages/`)
**Performance Goals**: N/A
**Constraints**: No git history rewrites without maintainer approval (Q11)
**Scale/Scope**: 17 package.json files (1 root + 16 packages), 4 new files, 1 config file

## Constitution Check

No violations. This feature adds static files and configuration only — no new packages, no new abstractions, no architectural changes.

## Project Structure

### Documentation (this feature)

```text
specs/036-prepare-repository-public/
├── plan.md              # This file
├── spec.md              # Feature specification
├── clarifications.md    # Resolved Q&A
├── checklists/          # (empty)
└── contracts/           # (empty — no API contracts)
```

### Source Code (repository root)

```text
/workspaces/latency/
├── LICENSE                  # NEW — Apache 2.0 license text
├── SECURITY.md              # NEW — security policy and reporting
├── .gitleaks.toml           # NEW — gitleaks configuration + allowlist
├── .github/
│   └── CODEOWNERS           # NEW — code ownership rules
├── package.json             # MODIFIED — add "license": "Apache-2.0"
└── packages/
    ├── latency/package.json              # MODIFIED — add license field
    ├── plugin-dev-agent/package.json     # MODIFIED — add license field
    ├── plugin-issue-tracker/package.json # MODIFIED — add license field
    ├── plugin-source-control/package.json# MODIFIED — add license field
    ├── plugin-ci-cd/package.json         # MODIFIED — add license field
    ├── plugin-health-check/package.json  # MODIFIED — add license field
    ├── plugin-github-issues/package.json # MODIFIED — add license field
    ├── plugin-github-actions/package.json# MODIFIED — add license field
    ├── github-issues-interface/package.json  # MODIFIED — add license field
    ├── github-actions-interface/package.json # MODIFIED — add license field
    ├── plugin-git/package.json           # MODIFIED — add license field
    ├── git-interface/package.json        # MODIFIED — add license field
    ├── plugin-jira/package.json          # MODIFIED — add license field
    ├── jira-interface/package.json       # MODIFIED — add license field
    ├── plugin-claude-code/package.json   # MODIFIED — add license field
    └── claude-code-interface/package.json# MODIFIED — add license field
```

## Implementation Phases

### Phase 1: LICENSE file and package.json updates

**Goal**: Establish the legal foundation for public release.

**Files created**:
- `/LICENSE` — Full Apache License 2.0 text with copyright line: `Copyright 2026 The Generacy AI Authors`

**Files modified** (17 total):
- `/package.json` — Add `"license": "Apache-2.0"` field
- All 16 `packages/*/package.json` — Add `"license": "Apache-2.0"` field to each

**Details**:
1. Create `LICENSE` file at repo root with the standard Apache 2.0 text from https://www.apache.org/licenses/LICENSE-2.0. The copyright notice line: `Copyright 2026 The Generacy AI Authors`.
2. Add `"license": "Apache-2.0"` to the root `package.json` (after the `"name"` field for conventional ordering).
3. Add `"license": "Apache-2.0"` to each of the 16 package-level `package.json` files. Use the SPDX identifier `Apache-2.0` per npm convention.

**Decisions** (from clarifications):
- Apache 2.0 chosen for patent grant protection (Q1)
- Copyright holder: "The Generacy AI Authors" (Q2)
- Copyright year: 2026 only (Q3)

**Verification**:
- `[ -f LICENSE ]` — file exists
- `grep -q "Apache License" LICENSE` — correct license
- `grep -q "2026 The Generacy AI Authors" LICENSE` — correct copyright line
- All 17 package.json files contain `"license": "Apache-2.0"`

---

### Phase 2: SECURITY.md

**Goal**: Define the vulnerability reporting process for external security researchers.

**Files created**:
- `/SECURITY.md`

**Content structure**:
1. **Supported Versions** — State that the project is pre-1.0, security fixes apply only to the latest release on the main branch (Q7).
2. **Reporting a Vulnerability** — Primary channel: GitHub Security Advisories (via the "Report a vulnerability" button on the Security tab). Fallback: `security@generacy.ai` (Q4).
3. **Response Timeline** — Acknowledgment within 5 business days; best-effort fix timeline with no hard commitment (Q8).
4. **Disclosure Policy** — Coordinated disclosure. Reporters asked to allow reasonable time for fixes before public disclosure.
5. **Scope** — Clarify what's in scope (code in this repository, published npm packages) and what's out of scope (third-party dependencies, GitHub infrastructure).

**Decisions** (from clarifications):
- Pre-1.0 explicit status (Q7)
- Relaxed timelines: 5 business days ack, best-effort fix (Q8)
- Fallback email: security@generacy.ai (Q4)

**Verification**:
- `[ -f SECURITY.md ]` — file exists
- Contains "pre-1.0", "security@generacy.ai", "5 business days"

---

### Phase 3: .github/CODEOWNERS

**Goal**: Enable automated PR review assignment on GitHub.

**Files created**:
- `/.github/CODEOWNERS`

**Content**:
```
# Default owners for everything in the repo
* @generacy-ai/core-team
```

Single default owner rule — all files owned by `@generacy-ai/core-team` (Q5, Q6). No granular per-package rules at this stage.

**Pre-merge validation**: Before merging the PR, verify that the `@generacy-ai/core-team` team exists in the `generacy-ai` GitHub organization. If it doesn't exist, either create the team or substitute valid GitHub username(s). Invalid CODEOWNERS references are silently ignored by GitHub.

**Verification**:
- `[ -f .github/CODEOWNERS ]` — file exists
- Contains `* @generacy-ai/core-team`
- GitHub team existence confirmed via `gh api orgs/generacy-ai/teams/core-team` (should return 200)

---

### Phase 4: Secrets audit with gitleaks

**Goal**: Scan full git history for accidentally committed secrets and establish ongoing scanning configuration.

**Steps**:

1. **Install gitleaks** — Install via binary download or package manager. Verify with `gitleaks version`.

2. **Create `.gitleaks.toml`** — Persist a baseline configuration at repo root:
   ```toml
   title = "Gitleaks Configuration"

   [allowlist]
     description = "Global allowlist"
     paths = [
       '''pnpm-lock\.yaml''',
       '''\.gitleaks\.toml''',
     ]
   ```
   The allowlist starts minimal. False positives discovered during the scan (Q12) will be added here as path or regex rules.

3. **Run full history scan** — Execute:
   ```bash
   gitleaks detect --source . --verbose --report-format json --report-path gitleaks-report.json
   ```
   This scans all commits in the repository history.

4. **Triage findings**:
   - **True positives** (real secrets): Flag in the PR description. Do NOT rewrite history without explicit maintainer approval (Q11). Document the file, commit, and secret type.
   - **False positives**: Add to the `.gitleaks.toml` allowlist (Q12) as path or fingerprint exclusions.

5. **Re-run scan** — After updating allowlist, re-run to confirm a clean result (exit code 0).

6. **Document results** — Record in the PR description (Q10):
   - Tool and version used
   - Scan date
   - Number of findings (total, true positive, false positive)
   - Remediation actions taken
   - Clean scan confirmation

7. **Cleanup** — Remove `gitleaks-report.json` (do not commit the report file). Add `gitleaks-report.json` to `.gitignore`.

**Decisions** (from clarifications):
- Tool: gitleaks with persisted config (Q9)
- False positives: allowlist in `.gitleaks.toml` (Q12)
- Audit results: PR description only (Q10)
- History rewrite: maintainer approval required (Q11)

**Verification**:
- `[ -f .gitleaks.toml ]` — config exists
- `gitleaks detect --source . --exit-code 1` returns exit code 0 (no findings)
- `gitleaks-report.json` is in `.gitignore`

---

### Phase 5: Final verification and PR

**Goal**: Validate all artifacts and prepare the pull request.

**Checklist**:
1. All new files exist at expected paths:
   - `LICENSE`
   - `SECURITY.md`
   - `.github/CODEOWNERS`
   - `.gitleaks.toml`
2. All 17 `package.json` files contain `"license": "Apache-2.0"`
3. `gitleaks detect` returns clean (exit code 0)
4. `@generacy-ai/core-team` team existence verified
5. No unintended file changes (review `git diff` carefully)
6. `.gitignore` includes `gitleaks-report.json`

**PR description** should include:
- Summary of all changes
- Secrets audit report (tool, version, date, findings, remediation)
- Note about CODEOWNERS team validation
- Link back to this spec

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| License | Apache 2.0 | Patent grant protects contributors and downstream users (Q1) |
| Copyright holder | "The Generacy AI Authors" | Future-proof, covers all contributors (Q2) |
| Copyright year | 2026 | Year of public release, avoids maintenance burden (Q3) |
| CODEOWNERS granularity | Single `*` rule | One team, no benefit to per-package rules yet (Q6) |
| Secrets scanner | gitleaks (persisted config) | Reusable for CI, industry standard (Q9) |
| SLA timelines | 5 biz days ack, best-effort fix | Realistic for early-stage team (Q8) |
| Version support | Pre-1.0 explicit | Honest about maturity, avoids false expectations (Q7) |
| Audit documentation | PR description | Point-in-time artifact, tied to go-public event (Q10) |
| History rewrite | Requires maintainer approval | Destructive operation, must be coordinated (Q11) |
| False positives | Allowlist in `.gitleaks.toml` | Self-documenting, prevents repeat flags in CI (Q12) |

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Secrets found in git history | High — blocks public release | Scan early (Phase 4). If found, flag in PR and escalate to maintainer for approval before any history rewrite. |
| `@generacy-ai/core-team` doesn't exist | Low — CODEOWNERS silently ignored | Verify with `gh api` before merging. Create team or use individual usernames as fallback. |
| Gitleaks false positives | Low — noisy scan results | Triage each finding, add false positives to `.gitleaks.toml` allowlist. Re-run until clean. |
| Apache 2.0 NOTICE file requirement | Low — Apache 2.0 technically requires a NOTICE file if attributions exist | No third-party attributions to list currently. A NOTICE file can be added later if needed. |
| pnpm-lock.yaml triggers gitleaks | Low — lock files contain hashes that look like secrets | Pre-configured in `.gitleaks.toml` allowlist paths. |

## Complexity Tracking

No violations. This feature adds 4 static files and modifies 17 package.json fields. No new packages, abstractions, or architectural patterns introduced.
