# Clarifications: Remove legacy .claude/autodev.json

## Batch 1 — 2026-03-13

### Q1: Empty .claude/ directory after deletion
**Context**: Acceptance criterion AC-3 states "The `.claude/` directory is preserved (it contains other valid files like `CLAUDE.md` settings)." However, `.claude/` currently contains **only** `autodev.json` — there are no other files in the directory. `CLAUDE.md` lives at the repo root, not inside `.claude/`. After deleting `autodev.json`, the directory will be empty and git will not track it.
**Question**: Should we simply let the `.claude/` directory disappear from the repo after deletion (natural git behavior), or should we add a `.gitkeep` to preserve it? Alternatively, should AC-3 be removed since its premise (other files exist) is incorrect?
**Options**:
- A: Let the `.claude/` directory disappear naturally (simplest, no empty dirs in repo)
- B: Add a `.gitkeep` to preserve the directory for future use
- C: Remove AC-3 from the spec since no other files exist in `.claude/`

**Answer**: Empty .claude/ directory after deletion
**Context**: Acceptance criterion AC-3 states "The `.claude/` directory is preserved (it contains other valid files like `CLAUDE.md` settings)." However, `.claude/` currently contains **only** `autodev.json` — there are no other files in the directory. `CLAUDE.md` lives at the repo root, not inside `.claude/`. After deleting `autodev.json`, the directory will be empty and git will not track it.

**Question**: Should we simply let the `.claude/` directory disappear from the repo after deletion (natural git behavior), or should we add a `.gitkeep` to preserve it? Alternatively, should AC-3 be removed since its premise (other files exist) is incorrect?

**Options**:
- **A**: Let the `.claude/` directory disappear naturally (simplest, no empty dirs in repo)
- **B**: Add a `.gitkeep` to preserve the directory for future use
- **C**: Remove AC-3 from the spec since no other files exist in `.claude/`

---
*Please reply with your answers (e.g., `Q1: A`) and add the `completed:clarification` label when done.*
