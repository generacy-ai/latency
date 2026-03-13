# Quickstart: Remove legacy .claude/autodev.json

## Prerequisites

- Git access to the `046-summary-delete-legacy-claude` branch

## Implementation

```bash
# 1. Delete the legacy config file
git rm .claude/autodev.json

# 2. Verify build still passes
pnpm build

# 3. Commit the change
git commit -m "chore: remove legacy .claude/autodev.json (#46)"
```

## Verification

```bash
# Confirm file is gone
ls .claude/autodev.json  # Should fail: No such file or directory

# Confirm no remaining references in code (spec files are expected)
grep -r "autodev.json" --include="*.ts" --include="*.js" --include="*.yaml" --include="*.json" .
# Should return no results

# Confirm build passes
pnpm build
```

## Troubleshooting

| Issue | Resolution |
|-------|-----------|
| Build fails after deletion | Check if any tooling was added that reads `.claude/autodev.json` since the spec was written |
| `.claude/` directory still exists | Check for untracked files: `ls -la .claude/` |
