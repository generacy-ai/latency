# Quickstart: Workflow Verification Update

## What Changed

The verification phase in speckit workflows now uses `build.validate` instead of hardcoded `pnpm run test` and `pnpm run lint` commands.

## Before & After

**Before**: Only `test` and `lint` ran, only with `pnpm`:
```yaml
- name: run-tests
  uses: verification.check
  with:
    command: pnpm run test
- name: run-lint
  uses: verification.check
  with:
    command: pnpm run lint
```

**After**: All validation scripts are auto-discovered:
```yaml
- name: validate
  uses: build.validate
  continueOnError: true
```

## Files Modified

- `.generacy/speckit-feature.yaml` — Phase 7 (Verification)
- `.generacy/speckit-bugfix.yaml` — Phase 6 (Verification)

## Verification

To confirm the change works:

1. Run a speckit feature or bugfix workflow
2. Observe the verification phase uses `build.validate`
3. Confirm it discovers all configured scripts (e.g., `test`, `lint`, `typecheck`)

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `build.validate` not found | Agency plugin not updated | Ensure agency includes generacy-ai/agency#323 |
| Some scripts not discovered | Script naming convention | Check `build.validate` documentation for supported script patterns |
