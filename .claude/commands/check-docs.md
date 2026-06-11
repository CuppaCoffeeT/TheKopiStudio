(ALWAYS RUN ON /GIT-SYNC)

Review `.md` files for quality and coherence, then check `docs/` index health.

If $ARGUMENTS is empty, check the conversation context for clues — an ongoing discussion, edit, or file the user referenced. If found, use that file/topic automatically and tell the user what you picked. Only if no context clue exists, ask: "What topic or area should I review? (e.g. pagination, auth, migrations, or 'all')" and wait before proceeding.

Clean result: `Docs healthy — no issues found.`

---

## Part A — Per-Document Quality Review

### Scope

Find and read every relevant `.md` file across:
- `docs/` (all subcategories)
- `.claude/commands/` (slash commands)
- `CLAUDE.md` (project instructions referencing the topic)
- `.claude/` (setup/maintenance files)
- Memory files in project memory

### Evaluation Criteria

#### 1. Inconsistencies
- Conflicting instructions between files (different steps, mismatched IDs/paths/configs)
- Instructions in one file that contradict another

#### 2. Redundancy
- Same info repeated across files — consolidate or cross-reference instead
- **Exception:** PRESERVE "what we tried / debugging history" sections — these prevent re-attempting failed approaches

#### 3. Clarity
- Would an AI agent reading this for the first time know exactly what to do?
- Flag ambiguous instructions, missing context, or unclear steps

#### 4. Up-to-dateness
- Are dates, tool names, MCP configs, IDs, and referenced paths still current?
- Are module lists, registries, or enums still accurate?

### Context Architecture Checks

Validate the five-layer context architecture (see `docs/99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md`):

1. **CONTEXT.md existence** — Verify CONTEXT.md exists in: `src/`, `docs/`, `supabase/`, `.claude/`
2. **CONTEXT.md dating** — Each CONTEXT.md has a "Last updated" or date line in its header
3. **CONTEXT.md freshness** — Flag any CONTEXT.md with a "Last updated" date older than 90 days
4. **Routing completeness** — Every `.md` in `.claude/commands/` appears in CLAUDE.md routing table or Slash list
5. **Layer 3/4 separation** — No implementation plans (files containing `## Phase` or `## Progress` sections) sitting in `docs/03-features/`. These belong in `docs/05-implementation/`
6. **Layer 0 size** — CLAUDE.md is under 80 lines
7. **Index completeness** — Every `.md` in `docs/` (excluding CONTEXT.md and DOCUMENTATION_INDEX.md) appears in `DOCUMENTATION_INDEX.md`

### Token Budget Check

See [TOKEN_BUDGET.md](../../docs/99-meta/TOKEN_BUDGET.md). Budgets are **ceilings, not targets** — aim maximally concise. Use `wc -c`:

| Signal | Meaning |
|---|---|
| 🔴 `>100%` ceiling | Over — split or exempt |
| 🔴 `>6,000c` (guide/reference) | Proactive split even if under ceiling |
| 🟡 `80–100%` | Trim or plan split |
| 🟢 `≤80%` | OK |

Report: `File · Chars · Ceiling · % · Fix` (worst-first). For each 🔴: propose sub-guide filename · sections to extract · parent back-link · `CONTEXT.md` row to add.

---

## Part B — Index Health

Validate `docs/DOCUMENTATION_INDEX.md` and cross-file link integrity:

1. **Link resolution** — every link in `docs/DOCUMENTATION_INDEX.md` + `docs/CONTEXT.md` resolves.
2. **Unlisted** — every `docs/**/*.md` is in the index (exclude `CONTEXT.md`, `CONTEXT_MAP.md`, `DOCUMENTATION_INDEX.md`).
3. **Duplicates** — no path appears twice in the index.
4. **File count** — actual `.md` count matches index "Total Documents".
5. **Workspace back-links** — every `CONTEXT.md` Navigation lists all siblings (incl. `decisions.md`, `lessons.md`, `_archive/*`). Every sibling `.md` links back via `👉 Workspace router: [CONTEXT.md](./CONTEXT.md)` header OR `## 📚 Related`. `decisions.md` ↔ `lessons.md` cross-link. `_archive/*` → live `CONTEXT.md`.

---

## Process

1. Find and read all relevant files
2. Run Context Architecture Checks first — these are structural
3. Run token-budget check on scoped files
4. Run topic-specific quality checks (criteria 1–4) on scoped files
5. Run index health checks (Part B)
6. List all issues found with file + description
7. Fix the issues directly — edit the files
8. **Log non-obvious lessons** — for any fix that future agents could repeat as a mistake, append an entry to the relevant workspace `lessons.md` per [.claude/rules/lessons-logging.md](../rules/lessons-logging.md). Skip routine fixes (typos, link rot, formatting).
9. Summarize what was changed

## Fixes (ask before applying structural changes)

| Issue | Fix |
|---|---|
| Broken link | Fix path or remove from index |
| Unlisted file | Add to index in correct category |
| Duplicate entry | Remove extras |
| Wrong count | Update count |
| 🔴 over-budget OR >6,000c | Create sub-guide · parent links inline · sub-guide back-links in `## Related` · update folder `CONTEXT.md` Navigation |
| Missing back-link | Insert `👉 Workspace router: [CONTEXT.md](./CONTEXT.md)` + add row to `CONTEXT.md` Navigation |
| Inconsistency / stale reference | Fix in-place or cross-reference |
