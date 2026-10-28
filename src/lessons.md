# Lessons — src/ (app-wide build + tooling)

Append-only. Newest at the bottom. Format: [.claude/rules/lessons-logging.md](../.claude/rules/lessons-logging.md).

Last Updated: 2026-10-28

## 2026-10-28 — `knip --fix` strips exports that only the feature barrels re-export
**What happened**: after `knip --fix --fix-type exports`, `src/features/*/index.ts` re-exported ~27 names that no longer existed — and the build, vitest and the (then no-op) tsc gate all stayed green.
**Root cause**: nothing imports the feature barrels (routes lazy-import pages directly), so knip reports the barrels as unused FILES and does not count their re-exports as uses. Vite never bundles them, so only `tsc -p tsconfig.app.json` sees the break.
**Fix**: trimmed the dead names out of the barrels; always run `tsc -p tsconfig.app.json` after a knip fix pass. `src/utils/timezoneUtils.ts` is a knip entry so its sanctioned API (rules/timezone.md) is never stripped.

## 2026-10-28 — Tailwind v4 auto-detection compiled tests/ and docs/ into the app CSS
**What happened**: every build printed 21 `Unexpected ")"` css-syntax warnings and shipped 137 junk selectors (16 KB) — Playwright `[data-testid="…"]:visible` strings and zinc/navy-era classes from docs and `legacy_planner_v3.html`.
**Root cause**: `@import "tailwindcss"` scans the whole repo (minus .gitignore), not just `src/`.
**Fix**: `@import "tailwindcss" source("../src");` in `src/index.css`. A code comment containing `[attr="…"]:visible` will still mint a selector — keep such examples out of `src/` comments.
