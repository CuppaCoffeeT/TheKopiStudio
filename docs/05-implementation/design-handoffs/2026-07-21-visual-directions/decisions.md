# Decisions — Visual Directions handoff

_Last Updated: 2026-07-21 SGT_

## 2026-07-21 — Direction 1a "Masthead" chosen
**Decision**: Apply direction 1a (broadsheet editorial) from the Claude Design "Editorial direction exploration" project; 1b Ledger and 1c Vault rejected.
**Why**: User pick (in-conversation, 2026-07-21). Gold at its most disciplined; hairlines carry layout; monochrome cream→gold viz.
**Impact**: Type scale (Georgia 34/28/18, uppercase tracked kickers), gold restricted to CTA/focus/index-numerals/in-progress/links, charts monochrome by default (`--chart-accepted` → dim cream), new `--cta-primary-bg-active` token, dateline greeting masthead on dashboard. Spec: [1A_MASTHEAD_SPEC.md](./1A_MASTHEAD_SPEC.md).

## 2026-07-21 — Primitives ruling detached (same branch)
**Decision**: Enforcement regime around primitives (universal-components rules, 6a–6e coverage greps, SANCTIONED whitelist triplication, manifest scripts/plugin) removed; primitive components themselves stay.
**Why**: User is re-styling via Claude Design handoffs; the old mandate machinery pointed at the retired AppBase design program (also deleted from `project base`).
**Impact**: `/check-module`·`/check-repo` now run a single component-import-hygiene grep; design handoffs stage under `docs/05-implementation/design-handoffs/`; `docs/99-refactor/` retained as historical archive only.
