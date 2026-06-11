# Commands — Slash Workflows

20 user-invoked slash commands. Multi-step workflows that operate across `src/` · `docs/` · `supabase/`. Each is a `.md` file Claude reads on `/<name>` invocation.

## Scope

**Belongs**: multi-step workflows the user explicitly invokes.
**Doesn't**: detailed pattern enforcement (→ `rules/`); autonomous cron/agent definitions (→ `agents/`); one-line project rules (→ root `CLAUDE.md`).

## Navigation

### Git
| Command | Purpose |
|---------|---------|
| `git-sync.md` | Full pull/push cycle with checks |
| `git-quick.md` | Lightweight commit + push |
| `git-full.md` | `/git-sync` checks **+** push to main + full parallel E2E (`N` workers, default 5) → root-cause → fix → repeat until 100% green |

### Docs & context
| Command | Purpose |
|---------|---------|
| `check-docs.md` | Per-document review (4-criteria quality + token budgets) **+** docs/ index health (broken links, unlisted, duplicates, counts). Run on /git-sync. _(absorbed the former `docs-review`.)_ |
| `context-check.md` | Audit all CONTEXT.md files against CONTEXT_MAP |
| `context-audit.md` | Deep context-architecture audit per WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD |

### Codebase audits
| Command | Purpose |
|---------|---------|
| `check-repo.md` | Whole-repo audit vs the 2026-05-31 refactor standard (12 structural checks; `npm run check:repo`). _(was `check-standard`.)_ |
| `check-module.md` | One-module audit — 11-gate DoD + 5 primitive greps + 7 arch greps **+ a11y + mobile** gates. _(was `compliance-check`; absorbed `check-a11y` + `check-mobile`.)_ |
| `code-hygiene.md` | Deep codebase scan — redundancy, stale refs, inconsistencies |
| `health-check.md` | System-wide health (TS, query-compliance, migration gaps, doc health) via the health-checker + docs-monitor agents |

### PRD & planning
| Command | Purpose |
|---------|---------|
| `prd-write.md` | Research-backed, prd-execute-ready PRD for substantial work |
| `prd-execute.md` | Orchestrate end-to-end PRD delivery via sub-agents |
| `scope-first.md` | Brain-Dump → Research → Design → Approve → Execute (no code until stage 3) |

### Testing & discovery
| Command | Purpose |
|---------|---------|
| `write-workflow-test.md` | Generate a Playwright spec from a natural-language workflow description |
| `explore-module.md` | Browser-driven workflow autodiscovery for one module → specs |

### Module lifecycle
| Command | Purpose |
|---------|---------|
| `create-module.md` | Scaffold a new feature module skeleton |
| `delete-module.md` | Safely remove a module (reference sweep + DB + gate verify) |

### Design system
| Command | Purpose |
|---------|---------|
| `design-import.md` | Fetch a Claude Design handoff URL, diff, promote to primitives |
| `design-prompt.md` | Emit a scoped prompt to paste into Claude Design |

### Cross-repo
| Command | Purpose |
|---------|---------|
| `prompt-jlcode-agent.md` | Intent-based prompts for the parallel JLCode session |

## Before working here

- **Decision tree** (where does new content go?):
  - Multi-step user workflow → here (`commands/`)
  - Detailed code/doc pattern → `rules/`
  - Autonomous task → `agents/`
  - Project-wide 1-liner → root `CLAUDE.md`
- **Naming**: `kebab-case.md`. Prefix `write-*` for authoring/generation commands (memory rule — discoverability when typing `/write`).
- **Registration**: add new commands to the Navigation table above (this file is the canonical command list — CLAUDE.md routes here). If user-facing, also add a row to the routing table in root [CONTEXT.md](../../CONTEXT.md).
- **Shape**: one job per command. If steps split (review vs author), make two commands.
- **Hygiene**: `_archive/` holds retired commands — don't restore without checking why they were archived.

## 📚 Related

- [.claude/CONTEXT.md](../CONTEXT.md) · [.claude/rules/CONTEXT.md](../rules/CONTEXT.md)
- Root [CLAUDE.md](../../CLAUDE.md) — entry point (routes here for the command list)
