# W23 — Design-lab handoff staging (/design-lab/handoffs)

**Goal**: Stage Claude Design handoff bundles in a preview route before promoting anything to `src/`. Iterate visually, A/B vs live primitives, promote per-file when happy.
**Tier**: Now · **Status**: 🟢 SHIPPED 2026-04-19 · **Automation**: hybrid
**Last Updated**: 2026-04-26 SGT — W23 #1 (`WhatsAppThreadPanel` staging + promote, handoff `2026-04-26-LWwN0H4g`) + W23 #1.1 (failed-banner / char-counter polish + QuotationWhatsAppTab adoption + `comms/` orphan delete) shipped today.
**Blocked by**: W08 STEP 2 output (Heavyweight Detail handoff URL received 2026-04-19 `.../v1/design/h/Upp99-AisrO_3WYilXEyqg`). **Blocks**: W08 STEP 3 (shared-primitive build). Must ship before W07 starts coding the 9 new primitives.

## Why this exists

Today's `/design-import` skill fetches the Claude Design API URL, reads the bundle's README, and writes Edits directly into `src/`. Once promoted, the only way to "see" the design is to run the app and click through. No side-by-side comparison with the live primitive · no rollback · no A/B. For S4a WAVE 1 where 9 primitives fan out to 5 pages this is high-risk — subtle visual bugs in a shared primitive multiply across 141 workflows.

W23 inserts a staging layer: every handoff lands as a dated full-system snapshot under `docs/99-refactor/_system/design/handoffs/<YYYY-MM-DD>-<short-hash>/`, a new route at `/design-lab/handoffs` iframes the preview HTMLs side-by-side with the current live primitive (plus diff-vs-previous-snapshot highlight), and a "Promote to src" button invokes the revised `/design-import --promote` skill for just that primitive.

**Important**: every Claude Design handoff URL returns the **full** published design system, not a per-session slice. Snapshots are therefore system-wide snapshots in time, chronologically listed, with per-file `new/changed/unchanged/removed` diffs computed against the prior snapshot.

## Scope

**In**:
- New route `/design-lab/handoffs` (gated via `useAuth().modules` — dev/admin only, reuse `/design-lab` module)
- Sidebar lists snapshot folders under `docs/99-refactor/_system/design/handoffs/` chronologically (newest first), with diff summary per snapshot (N new · N changed · N unchanged · N removed)
- Main panel: iframe the snapshot's preview HTMLs · split-view against current live primitive from `src/components/primitives/**` · optional toggle to compare against previous snapshot instead of live
- Per-primitive "Promote to src" button → invokes revised `/design-import --promote` skill scoped to that file
- Keep last 5 snapshots; older auto-move to `handoffs/_archive/`
- Revised `/design-import` skill:
  - Input: handoff URL **OR** existing snapshot folder path
  - Stage mode (default): fetch → write to `docs/99-refactor/_system/design/handoffs/<YYYY-MM-DD>-<short-hash>/` · compute diff vs prior snapshot · write MANIFEST.json · no src/ writes
  - Promote mode (`--promote <file>`): run the mapped Edit for one specific primitive
- Revised `/design-prompt` skill: append flow hint explaining stage → /design-lab/handoffs → promote loop

**Out**:
- No wholesale bundle copy into `src/` at any point
- No HTML prototypes in `src/` — they stay in `docs/.../handoffs/`
- No auto-promote — user always clicks
- No per-session staging (the API returns full-system bundles, so staging is always full-snapshot)

## Dependencies on other cards

- **Consumes**: W07 primitives (live side) · W08 handoff exports (staged side)
- **Blocks**: W08 STEP 3 (W07 should only build primitives from a reviewed staging folder, not a raw URL fetch)
- **Extends**: existing `/design-lab` module — already has `/design-lab/fonts` + `/design-lab/overlays`; `/design-lab/handoffs` is sibling route
- **Pairs with**: revised `/design-import` + `/design-prompt` skills (same commit)

## Done-when

- [ ] Vite config serves `docs/99-refactor/_system/design/handoffs/**/*.html` read-only via `/docs-assets/handoffs/` alias
- [ ] `src/features/design-lab/handoffs/HandoffsLabPage.tsx` route renders at `/design-lab/handoffs`
- [ ] Sidebar scans all dated snapshot folders under `docs/99-refactor/_system/design/handoffs/` (build-time manifest JSON)
- [ ] Each snapshot row shows: date · short-hash · diff summary (N new · N changed · N unchanged) · "Open" link
- [ ] Main panel: iframe preview HTML left · current live primitive right · toggle to compare-vs-previous-snapshot instead of live
- [ ] "Promote to src" button per primitive invokes revised `/design-import --promote <file>`
- [ ] Revised `/design-import` stages by default (writes to `docs/.../handoffs/<date>-<hash>/`, no src/ write)
- [ ] Revised `/design-import` computes diff vs prior snapshot · writes MANIFEST.json
- [ ] Revised `/design-import --promote` runs mapped Edit on one file
- [ ] Revised `/design-prompt` notes stage→promote flow
- [ ] Auto-archive snapshots > 5 to `handoffs/_archive/`
- [ ] WAVE 1 Heavyweight Detail handoff (URL above) staged at `docs/99-refactor/_system/design/handoffs/2026-04-19-<hash>/` as the first test
- [ ] User reviews at `/design-lab/handoffs` · iterates if needed · promotes to src/
- [ ] DESIGN_CATALOG row "Handoff staging" ✅

## Open questions

- **Q-W23-a** — Archive policy. Keep last 5 per session or keep all? Default: keep all (disk is cheap, designs are history); archive only when the session ships all waves.
- **Q-W23-b** — Side-by-side rendering. iframe each HTML or extract and embed? Default: iframe (safer, no React reconciliation fights; CSS isolation for free).
- **Q-W23-c** — Who can access `/design-lab/handoffs`? Default: anyone with `/design-lab` module (dev/admin). No new module.

## Related

- [W07_SHARED_PRIMITIVES.md](W07_SHARED_PRIMITIVES.md) — primitives live in src/components/primitives/
- [W08_DESIGN_SYSTEM.md](W08_DESIGN_SYSTEM.md) — S4a game plan that now has W23 inserted between STEP 2 and STEP 3
- `.claude/commands/design-import.md` — revised skill (stage + promote modes)
- `.claude/commands/design-prompt.md` — revised skill (output path hint)
- [CLAUDE_DESIGN_GAME_PLAN.md](../CLAUDE_DESIGN_GAME_PLAN.md) — full archetype roadmap
