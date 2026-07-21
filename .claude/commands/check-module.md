---
description: Audit an existing feature module against the 11-gate Definition of Done + component-import-hygiene grep + 7 architecture-rule greps + a11y + mobile. Reports pass/fail per gate with evidence; fixes nothing unless asked.
argument-hint: "<module-name>  (e.g. material-requests)  — or 'all' to sweep every feature"
allowed-tools: Bash, Read, Grep, Glob, mcp__supabase__execute_sql, mcp__supabase__get_advisors
---

# Check Module

Audit `src/features/$ARGUMENTS/` (or every feature if `all`) against the canonical Definition of Done, including accessibility (axe-playwright) and mobile (mobile-safari) gates. Read-only by default — report, don't fix (offer to fix at the end). Authority: `docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md`.

## The 11 gates (run each; report ✅/❌ + evidence)

1. **Types** — `npx tsc --noEmit` → 0 errors; no `any` (lint `no-explicit-any` clean in the folder).
2. **Lint** — `npm run lint` → within cap (15).
3. **Query compliance** — every `.select(` in `src/features/<x>/` has a `.range(`/`.limit(`/`.single(` (grep + eyeball; flag any unbounded select). See Gate 9.4 for the guided procedure.
4. **RLS** — for each table the module owns: RLS enabled, a minimal authenticated policy exists, writes are capability-gated (`has_capability`), FKs reference `public.users(id)` not `auth.users`. Verify via `execute_sql` against `pg_policies` + `get_advisors(security)`. See Gate 9.8.
5. **Component import hygiene** — the grep below returns zero: shared UI comes from `@/components/primitives/**`, `@/components/ui/**`, or `@/components/shared/**` only (no cross-feature or stray-domain imports).
6. **Drift** — `npm run drift:check` → 0 net-new (no circular, no cross-feature import, no pages→features). Confirm the feature isn't a new offender. **"0 net-new" is necessary but NOT sufficient for structure** — also assert the three structural rules report **literal zero** (run the full check, then grep the rule names):
   ```bash
   npm run drift:check 2>&1 | grep -cE "no-stray-domain-components|no-pages-to-features|no-pages-import-outside-pages"   # → 0
   ```
   Any of these firing means a domain folder, page-shell, or page import is misplaced regardless of baseline.
7. **LOC** — `npm run loc:check` → no file in the folder over 200 LOC beyond baseline. List any >200 file in the folder.
8. **Build + E2E** — `npm run build` passes; a `@p0` Playwright spec exists for the module under `tests/workflows/<x>/` and passes.
9. **Architecture-rule greps** — the 7 per-feature greps below (Gate 9) + the RLS-presence MCP check (9.8). Each returns zero or passes guided review.

## Component import hygiene grep (run inside `src/features/<x>/`)

```
# @/components/* imports outside primitives/ + ui/ + shared/
grep -rn "@/components/" src/features/<x> | grep -vE "(primitives|shared|ui/)"
```
Must be zero — any hit is a cross-feature or stray-domain import; report the file:line. Reuse existing shared components (`primitives/`, `ui/`, `shared/`) — a new design system from Claude Design will replace the old primitive mandates.

## Folder structure (run each; report ✅/❌ + evidence)

The feature folder must match `CANONICAL_FEATURE_FOLDER.md`. No gate above asserts placement — this one does. Set `SLUG=<x>`.

```bash
SLUG=<x>
# canonical sub-folders named correctly (api/ present only if the feature owns data)
ls -d src/features/$SLUG/{components,hooks,lib,pages} 2>/dev/null
test -f src/features/$SLUG/index.ts        # barrel present (the only cross-feature import surface)
test -f src/features/$SLUG/CONTEXT.md       # routing doc present
test -f src/features/$SLUG/types.ts || true # flat types.ts present-if-the-feature-is-typed
test ! -d src/features/$SLUG/types          # FAIL if a types/ dir exists — must be flat types.ts
test ! -d src/components/$SLUG              # FAIL if a stray domain-components folder exists
# no loose domain file at src/ or src/components/ root carrying the module name
ls src/$SLUG.* src/components/$SLUG.* 2>/dev/null   # → nothing
```

Folders must be named exactly `api/ components/ hooks/ lib/ pages/` (never variants). `types.ts` is a flat file, never a `types/` directory. Cross-feature surfaces live in `src/components/shared/<domain>/`, not a top-level `src/components/<x>/`.

## Gate 9 — Architecture-rule greps (run each; report ✅/❌ + evidence)

These were prose-only "extra hygiene" warnings before — now concrete, runnable greps. Each maps to a `CLAUDE.md` Hard Rule. Set `SLUG=<x>`. Unless noted, **expected result is ZERO matches**. Full detail + allowlists: `docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md` → "Gate 9".

```bash
SLUG=<x>
# 9.1 Toast — must be 0 (use showSuccess/showError from @/utils/toastHelper) — toast-system.md
grep -rnE "from ['\"]@/hooks/use-toast['\"]|useToast\(" src/features/$SLUG
# 9.2 Hardcoded role strings — must be 0 (use useAuth().modules) — module-access.md
grep -rnE "\.role\s*===\s*['\"]|\[['\"](super_admin|management|coordinator|supervisor|drafter|Office_admin)['\"]\]\.includes" src/features/$SLUG
# 9.3 Raw date-fns — GUIDED: arithmetic/comparison OK; any format/parse/display import is a violation — timezone.md
grep -rnE "from ['\"]date-fns['\"]" src/features/$SLUG
# 9.4 Unbounded select — GUIDED: open each hit, confirm a nearby .range(/.limit(/.single(/.maybeSingle(/{ count: — query-compliance.md
grep -rn "\.select(" src/features/$SLUG
# 9.5 URL state (LIST archetype only) — want ≥1 useURLPagination, 0 raw useSearchParams boilerplate — url-standards.md
grep -rn "useURLPagination" src/features/$SLUG ; grep -rn "useSearchParams" src/features/$SLUG
# 9.6 Dark-mode card surfaces — GUIDED: every card-shaped bg-white needs a dark:bg-zinc-950 — dark-mode.md
grep -rnE "bg-white" src/features/$SLUG | grep -v "dark:"
# 9.7 Mobile vh literals — must be 0 (use dvh not vh) — mobile-web.md
grep -rnE "max-h-\[[0-9]+vh\]|h-\[[0-9]+vh\]|min-h-\[[0-9]+vh\]" src/features/$SLUG
```

**9.3 date-fns allowlist** — SANCTIONED (returns `Date`/`number`/`boolean`, no tz side-effect): `startOfMonth` `endOfMonth` `startOfYear` `endOfYear` `addMonths` `subMonths` `addDays` `subDays` `addHours` `setMonth` `setYear` `eachDayOfInterval` `isAfter` `isBefore` `isEqual` `isValid` `differenceInDays` `getMonth` `getYear` `getDay`. VIOLATION (returns a string → locale-dependent): `format` `formatDistance` `parseISO` `parse` → swap to `@/utils/timezoneUtils`.

**9.4 unbounded select** — grep can't span the builder chain, so this is a guided manual check, not a pure pass/fail grep. A `.select()` with none of `.range(`/`.limit(`/`.single(`/`.maybeSingle(`/`{ count:` nearby is unbounded → silent truncation at 1,000 rows → violation.

**9.5 / 9.6 / 9.7** — 9.5 applies only to LIST-archetype features (detail/form/dashboard/tool with no URL state are exempt). 9.6 + 9.7 are primarily VISUAL — the greps catch the worst offenders only; finish with a DevTools dark-class toggle + real-iPhone-Safari pass.

**9.8 RLS presence (Supabase-MCP, required — not greppable)** — for each table the module owns: `get_advisors(security)` shows no `rls_disabled_in_public` / unsanctioned `rls_policy_always_true`; `pg_policies` has ≥1 policy; FKs → `public.users(id)` not `auth.users`; capability functions are `(SELECT …)`-wrapped. — rls-policy.md

## Gate 10 — Accessibility (axe-playwright)

Runs axe-core against the module's `@p0` Playwright specs. Zero critical + serious WCAG 2A/2AA violations required.

1. Locate specs: `grep -l "@p0" tests/workflows/**/*<slug>*.spec.ts`.
2. Each spec must import and call `injectAxe` + `checkA11y` from `axe-playwright` after the primary assertion (`runOnly: ['wcag2a', 'wcag2aa']`). If `--fix-stubs` is passed, inject the standard block into specs missing it.
3. Run: `npx playwright test --grep @p0 tests/workflows/**/*<slug>*.spec.ts`.
4. Any `critical` or `serious` violation → **HARD FAIL**. `moderate` → warn. Never silence with `axe.disableRules()` — fix at source.

Common culprits: `color-contrast` (zinc-100 hover on zinc-100 bg), `label` (bare `<input>` without `<Field>` wrapper), `button-name` (`<IconButton>` missing `aria-label`), `focus-visible` (missing red-7 ring), `region` (landmark overridden — use `<DetailPageFrame>`).

## Gate 11 — Mobile (mobile-safari)

Detects mobile-specific code paths and confirms Playwright coverage on the `mobile-safari` project (iPhone 13).

1. If archetype is **list** (has `DataTable`) → mobile spec is **required unconditionally** (DataTable renders `MobileListCard` at `< md`).
2. Otherwise grep for mobile primitives:
   ```bash
   grep -rnE "MobileListCard|<DrawerRoot|FloatingCTA|md:hidden|hidden md:|PSMobileActionBar|window\.history\.back" src/features/<slug>/
   ```
3. If zero hits and not a list → mobile spec optional; report and continue.
4. If mobile spec required, verify coverage: `grep -l "@mobile\|mobile-safari" tests/workflows/**/*<slug>*.spec.ts` — missing = **HARD FAIL**.
5. Run: `npx playwright test --project=mobile-safari --grep "@p0.*<slug>\|<slug>.*@p0"` — must be green.

Hard rules: every mobile-specific primitive must be exercised in its opened/active state; tap targets must be ≥ 44×44 pt; console must be clean on the mobile viewport.

## Other hygiene (report as warnings)

- queryKeys factory used (no hardcoded `queryKey: ['...']`).
- No hardcoded/test/placeholder data; no TODO; no commented-out dead code.
- Per-module doc health: run `/check-docs` on the module docs (replaces the retired `/align-module-docs`).

## Output

A per-gate scorecard table (gate · ✅/❌ · evidence/file:line) covering all 11 gates, an overall PASS/FAIL, and a prioritized fix list. If run with `all`, one row per feature + a summary of the worst offenders. End by asking whether to fix the failures (then route fixes through subagents, orchestrator commits).

## 📚 Related

- `docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md` (authority doc)
- `docs/01-system-architecture/canonical-page-patterns/CANONICAL_FEATURE_FOLDER.md` — the folder shape the Folder-structure gate asserts
- `.dependency-cruiser.cjs` — `no-stray-domain-components` / `no-pages-to-features` / `no-pages-import-outside-pages` (severity `error`)
- `.claude/rules/` — query-compliance · rls-policy · timezone · toast-system · mobile-web · dark-mode · react-query
- `write-workflow-test.md` — new specs should include `injectAxe`/`checkA11y` block + `@mobile` coverage by default
- `playwright.config.ts` — `mobile-safari` project definition (iPhone 13)
