# Context Map
> Last updated: 2026-03-27

Complete map of all CONTEXT.md files, folder coverage, and cross-workspace routing. Updated nightly by `docs-monitor` agent.

---

## Cross-Workspace Routing

Workspaces are NOT siloed. Each workspace routes to others for domain knowledge:

```
src/CONTEXT.md    ──→  docs/03-features/   (business logic specs)
                  ──→  docs/01-system-architecture/  (design standards)
                  ──→  .claude/rules/      (code constraints)

docs/CONTEXT.md   ──→  src/               (where implementations live)
                  ──→  supabase/           (where schema lives)
                  ──→  .claude/rules/      (where conventions are enforced)

supabase/CONTEXT.md ──→ .claude/rules/     (migration + RLS patterns)
                    ──→ docs/06-operations/migrations/  (governance docs)

.claude/CONTEXT.md  ──→ src/, docs/, supabase/  (rules enforce across all workspaces)
```

**Pattern**: `docs/` = WHAT and WHY · `src/` = HOW · `supabase/` = WHERE (data) · `.claude/rules/` = CONSTRAINTS

---

## Layer 0 — Entry Point

| File | Status | Last Audited | Next Audit |
|------|--------|-------------|------------|
| `CLAUDE.md` | 69 lines | 2026-03-26 | 2026-04-02 |

## Layer 1 — Workspace Routers

| File | Status | Routes to | Last Audited | Next Audit |
|------|--------|-----------|-------------|------------|
| `src/CONTEXT.md` | exists | docs/03-features/, .claude/rules/ | 2026-03-26 | 2026-04-02 |
| `docs/CONTEXT.md` | exists | src/, supabase/, .claude/rules/ | 2026-03-26 | 2026-04-02 |
| `supabase/CONTEXT.md` | exists | .claude/rules/, docs/06-operations/ | 2026-03-26 | 2026-04-02 |
| `.claude/CONTEXT.md` | exists | src/, docs/, supabase/ | 2026-03-26 | 2026-04-02 |

## Layer 2 — Subfolder Contracts

| Folder | Files | Subfolders | CONTEXT.md | Last Audited | Next Audit |
|--------|-------|------------|------------|-------------|------------|
| `docs/01-system-architecture/` | 13 | 0 | exists | 2026-03-26 | 2026-04-02 |
| `docs/02-security/` | 5 | 0 | exists | 2026-03-26 | 2026-04-02 |
| `docs/03-features/` | 1 | 16 | exists | 2026-03-26 | 2026-04-02 |
| `docs/04-integrations/` | 15 | 0 | exists | 2026-03-26 | 2026-04-02 |
| `docs/05-implementation/` | 0 | 2 | exists | 2026-03-26 | 2026-04-02 |
| `docs/06-operations/` | 4 | 2 | exists | 2026-03-26 | 2026-04-02 |
| `docs/99-meta/` | 3 | 0 | exists | 2026-03-26 | 2026-04-02 |

## Layer 3 — Deep Subfolder Contracts

| Folder | Files | CONTEXT.md | Last Audited | Next Audit |
|--------|-------|------------|-------------|------------|
| `docs/03-features/autonomous-agent/` | 7 | exists | 2026-03-26 | 2026-04-02 |
| `docs/03-features/claiming/` | 6 | exists | 2026-03-26 | 2026-04-02 |
| `docs/03-features/invoicing/` | 5 | exists | 2026-03-26 | 2026-04-02 |
| `docs/03-features/ot-calculation/` | 3 | exists | 2026-03-26 | 2026-04-02 |
| `docs/03-features/project-management/` | 4 | exists | 2026-03-26 | 2026-04-02 |
| `docs/03-features/quotation/` | 7 | exists | 2026-03-26 | 2026-04-02 |
| `docs/03-features/work-entry/` | 4 | exists | 2026-03-26 | 2026-04-02 |
| `docs/05-implementation/active/` | 27 | exists | 2026-03-27 | 2026-04-03 |
| `docs/05-implementation/completed/` | 23 | exists | 2026-03-26 | 2026-04-02 |

---

## Full Tree

```
CLAUDE.md                                    ← Layer 0 (entry point)
├── src/CONTEXT.md                           ← Layer 1 (code workspace)
├── docs/CONTEXT.md                          ← Layer 1 (documentation workspace)
│   ├── 01-system-architecture/CONTEXT.md    ← Layer 2
│   ├── 02-security/CONTEXT.md              ← Layer 2
│   ├── 03-features/CONTEXT.md              ← Layer 2
│   │   ├── autonomous-agent/CONTEXT.md      ← Layer 3
│   │   ├── claiming/CONTEXT.md              ← Layer 3
│   │   ├── invoicing/CONTEXT.md             ← Layer 3
│   │   ├── ot-calculation/CONTEXT.md        ← Layer 3
│   │   ├── project-management/CONTEXT.md    ← Layer 3
│   │   ├── quotation/CONTEXT.md             ← Layer 3
│   │   └── work-entry/CONTEXT.md            ← Layer 3
│   ├── 04-integrations/CONTEXT.md          ← Layer 2
│   ├── 05-implementation/CONTEXT.md         ← Layer 2
│   │   ├── active/CONTEXT.md                ← Layer 3
│   │   └── completed/CONTEXT.md             ← Layer 3
│   ├── 06-operations/CONTEXT.md            ← Layer 2
│   └── 99-meta/CONTEXT.md                  ← Layer 2
├── supabase/CONTEXT.md                      ← Layer 1 (database workspace)
└── .claude/CONTEXT.md                       ← Layer 1 (tooling workspace)
```

---

## Rules

- **Create CONTEXT.md when**: folder has 3+ .md files OR 3+ subfolders
- **Skip when**: folder has <3 files AND <3 subfolders, purpose obvious from name
- **Audit cycle**: 7 days per CONTEXT.md (agent checks ~2 folders/night on rotation)
- **Who creates**: Agent flags → human approves → agent or human writes using `/context-check` command
- **Who maintains**: `docs-monitor` agent updates this map nightly, audits CONTEXT.md content on rotation
