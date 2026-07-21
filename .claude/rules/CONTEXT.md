# Rules — Auto-Loaded Pattern Enforcement

15 rule files. Auto-loaded reference patterns (Layer 3) — scoped via `paths:` frontmatter so rules load only when editing matching files.

## Scope

**Belongs**: detailed pattern enforcement with examples + manually-curated known-pattern notes.
**Doesn't**: multi-step workflows (→ `commands/`); autonomous task definitions (→ `agents/`); 1-line project rules (→ root `CLAUDE.md`).

## Navigation

| Rule | Enforces |
|------|----------|
| `code-hygiene.md` | 4-checks-when-touching-a-file (always-loaded, no paths) |
| `lessons-logging.md` | Append lessons/decisions to per-workspace `lessons.md`/`decisions.md` (always-loaded, no paths) |
| `documentation.md` | Doc placement, header format, naming, DOCUMENTATION_INDEX registration |
| `migrations.md` | Migration timestamp filenames, MIGRATION_TEMPLATE adherence |
| `mobile-web.md` | Touch-first rules — `dvh` not `vh`, popover-in-drawer height cap, 16px input zoom, 44px touch targets |
| `module-access.md` | `useAuth().modules` for RBAC — never role strings |
| `query-compliance.md` | Server-side pagination with `.range()`; explicit `.limit()` fallback |
| `react-query.md` | `queryKeys` factory, mutation invalidation pattern |
| `rls-policy.md` | Capability-based RLS, `has_capability()`, no `auth.users(id)` FKs |
| `shell-scripting.md` | Shell hygiene for scripts |
| `timezone.md` | `timezoneUtils` only, never raw `date-fns` |
| `toast-system.md` | `showSuccess` / `showError` only, no `useToast` |
| `ui-components.md` | Use `ui/` primitives, Portal in dialogs |
| `url-standards.md` | URL hyphen convention + `useURLPagination` for list state |

## Before working here

- **Always-loaded**: `code-hygiene.md` + `lessons-logging.md` have no `paths:` — apply everywhere.
- **Scoped**: every other rule has `paths:` frontmatter (e.g. `paths: ['src/**/*.ts*']`) so it auto-loads only on matching edits.
- **Structure**: Summary → Detailed Patterns → Known Patterns (when applicable) → References. Known-pattern notes are manually curated when a recurring mistake is observed.
- **Length**: target ≤80 lines (rule docs are guides, but stay tight). Split by sub-topic if longer.

## 📚 Related

- [.claude/CONTEXT.md](../CONTEXT.md) · [.claude/commands/CONTEXT.md](../commands/CONTEXT.md)
- Root [CLAUDE.md](../../CLAUDE.md) Hard Rules section
