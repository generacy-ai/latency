# Tasks: Create repository structure with pnpm workspace

**Input**: Design documents from `/specs/002-create-repository-structure-pnpm/`
**Prerequisites**: plan.md (required), spec.md (required), research.md (available), quickstart.md (available)
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (Infrastructure tasks marked as [INFRA])

## Phase 1: Workspace Foundation

- [ ] T001 Create `pnpm-workspace.yaml` with workspace configuration
- [ ] T002 Create root `package.json` with workspace scripts and engine requirements
- [ ] T003 Create `packages/latency/` directory structure
- [ ] T004 Create `packages/latency/package.json` with npm publishing configuration
- [ ] T005 Validate workspace with `pnpm install`

## Phase 2: TypeScript Configuration

- [ ] T006 [P] Create `tsconfig.base.json` with shared TypeScript configuration
- [ ] T007 [P] Create `packages/latency/tsconfig.json` extending base config
- [ ] T008 [P] Create `packages/latency/src/` directory
- [ ] T009 Create `packages/latency/src/index.ts` with empty barrel export
- [ ] T010 Add build script to root and package `package.json`
- [ ] T011 Validate TypeScript compilation with `pnpm build`

## Phase 3: Linting & Formatting

- [ ] T012 [P] [INFRA] Create `.eslintrc.js` matching Generacy standards
- [ ] T013 [P] [INFRA] Create `.prettierrc` matching Generacy standards
- [ ] T014 [P] [INFRA] Install ESLint and Prettier dev dependencies
- [ ] T015 Add lint and format scripts to root `package.json`
- [ ] T016 Validate linting with `pnpm lint`

## Phase 4: Testing Setup

- [ ] T017 [P] [INFRA] Create `vitest.config.ts` with test configuration
- [ ] T018 [P] [INFRA] Create `packages/latency/tests/` directory with `.gitkeep`
- [ ] T019 [P] [INFRA] Install Vitest dev dependencies
- [ ] T020 Add test script to root `package.json`
- [ ] T021 Validate test runner with `pnpm test`

## Phase 5: CI/CD Pipeline

- [ ] T022 [INFRA] Create `.github/workflows/` directory
- [ ] T023 [INFRA] Create `.github/workflows/ci.yml` with validation jobs
- [ ] T024 Configure CI jobs: build, type-check, lint, format-check, test
- [ ] T025 Configure pnpm caching in CI workflow
- [ ] T026 Validate CI triggers on branch push

## Phase 6: Documentation & Metadata

- [ ] T027 [P] [INFRA] Create root `README.md` with philosophy overview and links
- [ ] T028 [P] [INFRA] Create `packages/latency/README.md` with package documentation
- [ ] T029 [P] [INFRA] Create `CHANGELOG.md` with initial release entry
- [ ] T030 [P] [INFRA] Create `.gitignore` with Node.js/TypeScript ignore rules
- [ ] T031 Verify documentation links are valid
- [ ] T032 Verify README renders correctly on GitHub

## Phase 7: Final Validation

- [ ] T033 Run full validation suite: `pnpm install && pnpm build && pnpm test && pnpm lint`
- [ ] T034 Verify `prettier --check .` passes
- [ ] T035 Test package import: `node -e "import('@generacy-ai/latency')"`
- [ ] T036 Commit all changes with conventional commit message
- [ ] T037 Push to branch and verify CI passes

## Dependencies & Execution Order

### Sequential Dependencies
- **Phase 1 before Phase 2**: Workspace must exist before TypeScript config
- **Phase 2 before Phase 3-4**: TypeScript must compile before linting/testing
- **Phases 3-5 independent**: Can execute concurrently after Phase 2
- **Phase 6 before Phase 7**: Documentation should be complete before final validation

### Parallel Opportunities
- **Phase 3-5 tasks within phases**: Most tasks in these phases can run in parallel
  - T012, T013, T014 (linting/formatting config and dependencies)
  - T017, T018, T019 (testing config and dependencies)
  - T022, T023, T024, T025 (CI workflow setup)
- **Phase 6 tasks**: T027, T028, T029, T030 can all run in parallel

### Critical Path
1. T001-T005 (workspace setup)
2. T006-T011 (TypeScript configuration)
3. T012-T026 (tooling setup - can parallelize within phases)
4. T027-T032 (documentation)
5. T033-T037 (validation and commit)

### Validation Points
- After Phase 1: `pnpm install` succeeds
- After Phase 2: `pnpm build` succeeds and generates `dist/` artifacts
- After Phase 3: `pnpm lint` passes without errors
- After Phase 4: `pnpm test` runs without errors
- After Phase 5: CI workflow exists and is properly configured
- After Phase 6: All documentation links are valid
- After Phase 7: Full CI pipeline passes on GitHub

## Notes
- Reference `/workspaces/generacy/` for configuration templates (TypeScript, ESLint, Prettier)
- Empty `index.ts` export is intentional - actual exports added in issues #3, #4, #5
- No actual tests written in this phase - testing infrastructure only
- CI workflow should cache pnpm store for performance
- All validation commands should be run from repository root
