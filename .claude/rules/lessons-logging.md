---
description: Append non-obvious lessons to per-workspace lessons.md per the JLCode META standard
---

# Rule: Lessons & Decisions Logging (Workspace Memory)

## Summary

Capture institutional knowledge in two append-only files per workspace folder: `decisions.md` (what was decided + why) and `lessons.md` (what went wrong + the fix). Read before starting work in a folder; append after significant work or non-obvious failure. Format authority: [DECISIONS_LESSONS_PATTERN.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/DECISIONS_LESSONS_PATTERN.md). This pattern replaces the retired `agent_corrections` table loop.

## Detailed Patterns

### Where to log

**One pair per workspace folder** — scoped to the domain. Examples for this repo:

```
src/features/<domain>/             ← per-feature memory (e.g. people/, quotations/)
  ├── lib/decisions.md
  └── lib/lessons.md

docs/03-features/<feature>/        ← per-feature-doc memory
  ├── decisions.md
  └── lessons.md

docs/99-refactor/_system/          ← refactor-program memory
  ├── decisions.md
  └── lessons.md
```

Don't seed empty files everywhere. Create only when a real entry needs writing.

### When to log a lesson

- Something failed in a non-obvious way (a future agent could repeat the mistake)
- A workaround was needed
- A previous decision was reversed (write the new entry + `**Supersedes**: <date> — <old title>`)

### When to log a decision

- Choosing one approach over another
- Discovering a constraint not documented elsewhere
- Locking a default that future agents shouldn't re-litigate

### When NOT to log

- Routine task completion ("migrated 5 files")
- Obvious failures (typos)
- Information already in the code, git history, or CLAUDE.md rules

### Format (concise — 1 line per field)

```markdown
## YYYY-MM-DD — [Short title]
**What happened**: [one line]
**Root cause**: [one line]
**Fix**: [one line]
```

For decisions, fields are `**Decision**` · `**Why**` · `**Impact**`. Full schema in [DECISIONS_LESSONS_PATTERN.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/DECISIONS_LESSONS_PATTERN.md).

### Promotion (cross-domain)

If a lesson applies to 2+ workspaces, also append it to the parent folder's `lessons.md` with `**Origin**: <path/to/source>`. If important enough to be a permanent rule, promote to a CLAUDE.md Hard Rule + add `**Graduated to**: CLAUDE.md` to the lesson entry.

## Key Behaviours

- **Read before work** · **append after work** — autonomous, no asking
- **Append-only** — never edit past entries; supersede with new dated entries
- **Newest at the bottom** of the file
- **Update the `Last Updated` date** in the file header when appending
- **Don't duplicate Claude Code auto-memory** (`memory/` folder). User preferences belong there; domain knowledge belongs in lessons/decisions

## References

- [DECISIONS_LESSONS_PATTERN.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/DECISIONS_LESSONS_PATTERN.md) — full format spec + anti-patterns
- Root [CLAUDE.md](../../CLAUDE.md) Memory Rules section
- Related: [code-hygiene.md](./code-hygiene.md) — 4-checks-when-touching-a-file
