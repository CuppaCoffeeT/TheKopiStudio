# Module Compliance Checklist

**Created**: 2026-05-30 SGT
**Last Updated**: 2026-05-31 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

The audit/verify counterpart to [MODULE_CREATION_SOP.md](./MODULE_CREATION_SOP.md). Run this against **any feature module — new or existing** — to confirm it complies with AppBase standards. The SOP is *how to build*; this is *how to check*. Every gate is a literal command; any non-zero/fail = non-compliant → fix per the linked SOP step, then re-run.

## 📚 Related Documentation
- [MODULE_CREATION_SOP.md](./MODULE_CREATION_SOP.md) — the build guide (10 steps to create a module)

## How to use

```bash
SLUG=<feature-folder-name>   # e.g. companies, quotations, workorders
```
Run all 9 gates below in order. A module is compliant only when **every** gate passes. For a failing gate, the **Fix in** column points to the SOP step that explains the correct pattern.

## The 9 gates (Definition of Done)

| # | Gate | Command | Pass | Fix in |
|---|---|---|---|---|
| 1 | TypeScript | `npx tsc --noEmit` | exit 0, zero errors | — |
| 2 | Lint | `npm run lint` | exit 0 (cap `--max-warnings=15`) | SOP §7 |
| 3 | Primitive coverage | the 5 greps below | every grep returns zero | SOP §6 |
| 4 | Build | `npm run build` | succeeds (watch chunk warnings) | SOP §6 |
| 5 | E2E | `npm run test:e2e:p0` | @p0 green (author spec if missing) | — |
| 6 | Docs | `test -f src/features/$SLUG/CONTEXT.md && wc -c "$_"; ls docs/03-features/$SLUG/*.md; grep -n "$SLUG" docs/DOCUMENTATION_INDEX.md` | CONTEXT.md present + ≤1,600c; feature doc registered | SOP §8 |
| 7 | Memory | `grep -c "^## 2" src/features/$SLUG/lib/decisions.md` | ≥1 dated entry | SOP §8 |
| 8 | Drift | `npm run drift:check` | no net-new violations beyond baseline (no new cross-feature imports / cycles) | SOP §2, §6 |
| 8b | Folder structure | the structure asserts below | canonical shape; flat `types.ts` (no `types/` dir); no `src/components/<x>/`; `no-stray-domain-components` = **literal zero** | SOP §1 |
| 9 | Architecture-rule greps | the 7 per-feature greps below + the RLS-presence MCP check | each returns zero (or passes guided review) | SOP §3, §4, §5, §7 |

## Gate 3 — component-import hygiene

Feature code imports shared UI from `@/components/primitives/**`, `@/components/ui/**`, or `@/components/shared/**` — no cross-feature imports, no stray `src/components/<domain>/` folders. The former primitive-coverage greps (6a–6e) were retired 2026-07-21 when the primitives ruling was detached ahead of the new Claude Design system.

## Gate 8b — Folder structure (asserts placement; `npm run drift:check` baseline does NOT)

The feature must match [CANONICAL_FEATURE_FOLDER.md](../01-system-architecture/canonical-page-patterns/CANONICAL_FEATURE_FOLDER.md). "0 net-new" drift is **necessary but NOT sufficient** for structure — a misplaced domain folder may pre-date the baseline. Assert placement directly:

```bash
SLUG=<slug>
ls -d src/features/$SLUG/{components,hooks,lib,pages} 2>/dev/null   # named exactly — never variants (api/ only if feature owns data)
test -f src/features/$SLUG/index.ts          # barrel present (only cross-feature import surface)
test -f src/features/$SLUG/CONTEXT.md         # routing doc present
test ! -d src/features/$SLUG/types            # FAIL — types.ts must be a FLAT file, not a types/ dir
test ! -d src/components/$SLUG               # FAIL — no stray top-level domain-components folder
ls src/$SLUG.* src/components/$SLUG.* 2>/dev/null   # → nothing (no loose domain file at src/ or src/components/ root)
# the three structural dep-cruiser rules must report LITERAL ZERO:
npm run drift:check 2>&1 | grep -cE "no-stray-domain-components|no-pages-to-features|no-pages-import-outside-pages"   # → 0
```

`no-stray-domain-components` (severity `error` in [.dependency-cruiser.cjs](../../.dependency-cruiser.cjs)) forbids any `src/components/<domain>/` outside `primitives/ ui/ shared/`. Cross-feature surfaces promote to `src/components/shared/<domain>/`; feature-local UI stays in `src/features/<slug>/components/`.

## Gate 9 — Architecture-rule greps (per-feature)

These close the prose-only gaps in the prior DoD: the Hard Rules in `CLAUDE.md` (query bounds, RBAC, timezone, toast, RLS, dark-mode, mobile, URL-state) were documented but never gated. Each check below is a concrete runnable grep (or a named guided check where a grep can't span the chain). Run from repo root after setting `SLUG`. Unless noted, **expected result is ZERO matches**.

```bash
SLUG=<slug>
```

| # | Check | Command | Expected | Enforces |
|---|---|---|---|---|
| 9.1 | Toast | `grep -rnE "from ['\"]@/hooks/use-toast['\"]\|useToast\(" src/features/$SLUG` | **0** — use `showSuccess`/`showError` from `@/utils/toastHelper` | `.claude/rules/toast-system.md` |
| 9.2 | Hardcoded role strings | `grep -rnE "\.role\s*===\s*['\"]\|\[['\"](super_admin\|management\|coordinator\|supervisor\|drafter\|Office_admin)['\"]\]\.includes" src/features/$SLUG` | **0** — gate access via `useAuth().modules`, never role strings | `.claude/rules/module-access.md` |
| 9.3 | Raw date-fns | `grep -rnE "from ['\"]date-fns['\"]" src/features/$SLUG` | **guided** — see allowlist below | `.claude/rules/timezone.md` |
| 9.4 | Unbounded Supabase select | `grep -rn "\.select(" src/features/$SLUG` | **guided** — each must chain `.range(`/`.limit(`/`.single(`/`.maybeSingle(`/`{ count:` | `.claude/rules/query-compliance.md` |
| 9.5 | URL state (LIST archetype only) | `grep -rn "useURLPagination" src/features/$SLUG` ; `grep -rn "useSearchParams" src/features/$SLUG` | **≥1** `useURLPagination` AND **0** raw `useSearchParams` boilerplate on list pages | `.claude/rules/url-standards.md` |
| 9.6 | Light theme (surfaces) | `grep -rnE "dark:\|(bg\|text\|border\|ring\|divide)-(zinc\|slate\|gray)-" src/features/$SLUG` | **0** — the app is light-pinned, so `dark:` is dead code and cool neutrals clash with the cream ground; use `bg-card` / `text-foreground` / `border-border` | `.claude/rules/light-theme.md` |
| 9.7 | Mobile (vh literals) | `grep -rnE "max-h-\[[0-9]+vh\]\|h-\[[0-9]+vh\]\|min-h-\[[0-9]+vh\]" src/features/$SLUG` | **0** — use `dvh`, never `vh`, on containers/sheets/modals | `.claude/rules/mobile-web.md` |

### 9.3 — Raw date-fns allowlist (timezone.md, W12.04)

A `date-fns` import is a **violation** only when it pulls a **DISPLAY / format / parse** symbol (those read system locale/timezone). Pure **arithmetic / comparison** symbols are SANCTIONED — they operate on `Date` structurally with no tz side-effect. Review each 9.3 hit against this list:

- ✅ **SANCTIONED (arithmetic, returns `Date`)**: `startOfMonth`, `endOfMonth`, `startOfYear`, `endOfYear`, `addMonths`, `subMonths`, `addDays`, `subDays`, `addHours`, `setMonth`, `setYear`, `eachDayOfInterval`.
- ✅ **SANCTIONED (comparison/introspection, returns `number`/`boolean`)**: `isAfter`, `isBefore`, `isEqual`, `isValid`, `differenceInDays`, `getMonth`, `getYear`, `getDay`.
- ❌ **VIOLATION (DISPLAY / PARSE, returns a string or locale-dependent)**: `format`, `formatDistance`, `parseISO`, `parse`, and any other symbol that returns a formatted string → swap to the matching `@/utils/timezoneUtils` wrapper (`formatDisplayTime`, `formatDisplayDateShort`, `parseFromDatabase`, etc.).

Rule of thumb: **returns a string → locale-dependent → use `timezoneUtils`. Returns a `Date`/`number`/`boolean` → safe.** (The W08 `NEEDS-HUMAN` exception for `<input type="datetime-local">` widgets lives in `ui/` primitives, not feature folders — feature code has no excuse.)

### 9.4 — Unbounded select (guided manual check, NOT a pure pass/fail grep)

`grep` can't reliably follow the PostgREST builder chain (`.select(...)` and its `.range()`/`.limit()` may sit on different lines or behind a variable). So 9.4 is a **guided review**: list every `.select(` hit, then open each and confirm a nearby `.range(` (paginated list), `.limit(` (dropdown `.limit(5000)` / legacy `.limit(10000)`), `.single(` / `.maybeSingle(` (detail), or `{ count: 'exact', head: true }` (count-only). Any `.select()` with none of these is **unbounded → silent truncation at 1,000 rows → violation**.

### 9.6 / 9.7 — Dark-mode + mobile are primarily VISUAL

These two remain primarily manual/visual — the cheap greps above catch the worst offenders (a `bg-white` card with no `dark:` pairing; a `vh` literal) but cannot prove full compliance. After the greps, do the visual pass: toggle the `dark` class in DevTools (every card visibly darker than the page; focus ring `red-400`) and check touch behaviour on a real iPhone Safari (long forms in fullscreen modal not bottom drawer; 16px touch inputs).

### 9.8 — RLS presence (Supabase-MCP check, required step — NOT greppable in src)

For **each table the module owns** this is a required DB check, not optional prose:

1. `mcp__supabase__get_advisors({ type: 'security' })` → the table shows **no** `rls_disabled_in_public` and **no** unsanctioned `rls_policy_always_true` advisory (a deliberate Pattern A minimal `USING (true)` policy is fine).
2. `SELECT * FROM pg_policies WHERE tablename = '<table>'` → at least one policy exists (Pattern A minimal `USING (true)`, or Pattern B capability-based `USING ((SELECT public.<capability>()))`).
3. FKs reference `public.users(id)`, never `auth.users(id)`; any capability function call is `(SELECT …)`-wrapped (initplan).

Authority: `.claude/rules/rls-policy.md` (Pattern A / B / C) + `module-access.md`.

### Notes (apply to all Gate 9 greps)

- Matches inside `// comments`, JSDoc, or string literals are not real violations — open each hit and confirm it is live code.
- `.md` files in the folder are not code.
- 9.5 applies **only to LIST-archetype features**. Detail/form/dashboard/tool pages that hold no search/filter/page URL state are exempt.

## Deleting a module (reverse checklist)

Remove in this order so FKs and imports never dangle:

1. **Code** — `rm -rf src/features/<slug>/` (+ any thin `src/pages/<X>.tsx` shell).
2. **Routes** — delete the `App.tsx` route(s) + the barrel import line.
3. **Query keys** — remove the entity block + its `Filters` type from `src/utils/queryKeys.ts`.
4. **Database (migration via MCP)** — delete rows `user_modules` → `role_modules` → `modules` (FK order), then `DROP TABLE` the feature table(s) + their RLS policies + indexes. Write the `.sql` locally AND apply via `mcp__supabase__apply_migration` (never CLI).
5. **Tests** — delete `tests/**` specs referencing the routes / test-ids.
6. **Shared components** — for each `src/components/shared/<domain>/` surface the module owned, re-grep ALL features; delete **only if zero consumers remain** (else STOP + surface — do not orphan). Update `src/components/shared/CONTEXT.md` on deletion.
7. **Docs** — delete `docs/03-features/<slug>/`, remove the `docs/DOCUMENTATION_INDEX.md` row, and any inbound back-links from related docs (preserve any "Errors Encountered" debugging-history sections).
8. **Verify clean** — `grep -rn "<slug>\|/<route>" src/ tests/ docs/` returns zero, then `npm run drift:check` (`no-stray-domain-components` = 0) + `npx tsc --noEmit` are clean.
