# AppBase_REFACTOR — Claude Design Game Plan (W08 Phase 3)

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-04-19 SGT (eod+15f — session count updated 6 → 12 · S1 + S2 + S-shell + S3 ✅ shipped · W07 Phase 2 flipped 🔴 → 🟡 in progress · mapping table regenerated)
**Status**: 🟡 IN PROGRESS (4 of 12 sessions shipped and consuming)
**Priority**: 🔴 Critical

## 📋 Overview

The durable game plan for using Anthropic's Claude Design (research preview, launched 2026-04-17 at [claude.ai/design](https://claude.ai/design)) to lock the AppBase visual language archetype-by-archetype. This is **W08 Phase 3** — the "detailed design" phase that replaces the original Phase 3 scope (motion primitives + `/design-system` reference page, now deferred to Phase 4).

**Why this exists**: W08 Phase 2 landed tokens + app-wide activation + a 5,556-site violation audit. W07 Phase 1 shipped 10 behavioural primitives. Both are now blocked on ONE input: concrete visual specs per page-archetype. Claude Design is the mechanism that produces those specs; this doc is the map.

## 📚 Related Documentation

- [LOCKED_PICKS.md](LOCKED_PICKS.md) — source of truth for component picks + token values (W17 output)
- [W08_DESIGN_SYSTEM.md](workflows/W08_DESIGN_SYSTEM.md) — card
- [W07_SHARED_PRIMITIVES.md](workflows/W07_SHARED_PRIMITIVES.md) — consumes every session's visual spec
- [W09_MODULE_MIGRATIONS.md](workflows/W09_MODULE_MIGRATIONS.md) — applies the patterns across 80 pages
- [research/W08_PHASE_1_NOTES.md](research/W08_PHASE_1_NOTES.md) — Tailwind v4 migration gotchas
- [research/W08_PHASE_2_NOTES.md](research/W08_PHASE_2_NOTES.md) — app-wide activation decisions + slate-500 override (superseded 2026-04-19 by slate-700 final pick)
- [research/W08_PHASE_2_VIOLATIONS.md](research/W08_PHASE_2_VIOLATIONS.md) — 5,556-site audit that W07/W09 absorb

---

## Mental model

```
Layer 1 — TOKENS           (✅ W08 Phase 1 + Phase 2 shipped)
                    ↓
Layer 2 — PRIMITIVES       (✅ W07 Phase 1 · 🟡 W07 Phase 2 in progress · 28 primitives live)
                    ↓
Layer 3 — ARCHETYPES       (🟡 THIS DOC · 12 sessions · 4 shipped · 8 queued)
                    ↓
Layer 4 — PAGES/MODULES    (🟡 W09 kicking off · /dashboard 🟢 1st migration · 80+ pages queued)
```

**Session scope expanded 2026-04-19**: from 6 archetype sessions (original planning) → **12 sessions** to cover real-world complexity user surfaced (S-shell for app chrome · S10 Progress for CDW bars · S11 Spatial for map/drawing · S12 Integration cards). See updated session list below.

**Role separation**:

| Card | Owns | This phase's output |
|---|---|---|
| **W08** | Visual design system — tokens, archetype specs | Refined tokens + archetype visual specs |
| **W07** | Code structure of primitives — React APIs, props, tests | Phase 2 primitives built to archetype spec |
| **W09** | Application — wiring primitives into feature pages | Per-module commits consuming the archetypes |

---

## Module × archetype matrix (full inventory — 80 pages)

| # | Archetype | Modules / routes | Count |
|---|---|---|---|
| 1 | **List/Table** | /quotations · /clientprofiles · /projectlist · /workerlist · /companylist · /meetingprojects · /serviceslist · /staffmanagement · /peoplemanagement · /claims · /invoices · /emaillogs · /emailtemplates · /templatefiles · /nasfoldertemplates · /competitoranalysis · /engineer-workload · /dailyattendance · /coordinatorattendance · /hr-applications · /hr-pending-sends · /payment-management · /commspending · /admin/projects · /admin/companies · /admin/services | **26** |
| 2 | **Dashboard (KPI + chart)** | /dashboard · /admin-overview · /admin · /superadmin · /engineer-dashboard · /drafter-dashboard · /report-dashboard · /plan-purchase-dashboard · /nce-dashboard · /commsdashboard · /refactor-dashboard | **11** |
| 3 | **Detail page** | /quotations/:id · /projects/:id · /claims/:id · /invoices/:id · /progress-claims/:id · /engineer-project-detail/:id · /people/:id · /hr-applications/:id · /xeroinvoice/:id · /email-threads/:id · CompanyDetailView · ContactDetailView | **12** |
| 4 | **Form / Create** | /quotations/create · ~~/projects/create~~ ([DEPRECATED 2026-05-25](./DEPRECATIONS.md) — modal not route) · /invoices/create · /progress-claims/create · /supervisor (addworkentry) · /otentry · /generalworks (entry) · /hr-applications (apply) | **7** |
| 5 | **Settings / Config** | /quotationsettings · /emailaccount · /emailsettings · /pdftemplates · /xerosettings · /productsservices · /nasoperations | **7** |
| 6 | **Tool / Calculator** | /ot-calculator · /jltt · /leaves · /salary · /payslip · /performance-review | **6** |
| 7 | **Auth** (defer — low priority) | /login · /auth/verify · /auth/verified · /auth/reset-password | 4 |
| 8 | **Review workflows** (list+detail hybrid, absorbed into 1+3) | /coordinatorreview · /managementreview · /supervisorreview | 3 |
| 9 | **Inbox** (unique, absorbed into 5 Settings + parts of 1 List) | /emailinbox | 1 |
| 10 | **Internal/skip** | /design-lab · /design-lab/fonts | 2 |
| | **TOTAL** (12 sessions cover) | | **~80 pages** |

12 sessions (4 shipped 🟢 · 8 queued 🔴) × their archetypes = full coverage of every visible surface.

---

## Per-session → W07 primitive mapping (12 sessions · 2026-04-19)

Each Claude Design session produces the visual spec that unblocks a specific batch of W07 Phase 2 primitives. Updated roster below.

| # | Session | Status | W07 primitives produced/refined | Location |
|---|---|---|---|---|
| 1 | **List/Table** | ✅ shipped | `<DataTable>` · `<StatusBadge>` · `<Avatar>` · `<IconButton>` + tokens | `src/components/primitives/` |
| 2 | **Overlays** | ✅ shipped | Modal · Drawer · Popover · Tooltip · DropdownMenu · ContextMenu · Alert · Toaster · SearchableMultiSelect · Kbd (**10 primitives**) | `src/components/primitives/overlays/` |
| **S-shell** | **App Header + Phase A atoms + states** | ✅ shipped | AppHeader · Breadcrumb · ImpersonationBanner · Button · Chip · FilterBar · FloatingCTA · LoadingSkeleton · ErrorState · NoResultsState (**10 primitives**) | `src/components/primitives/shell/` |
| 3 | **Dashboard — module launcher** | ✅ shipped | GreetingHeader · ModuleCard · NeedsAttentionPill · AttentionHeader · CategoryHeader · ModuleSearch · CountBadge (**7 primitives**) | `src/components/primitives/dashboard/` |
| 4 | **Detail page** | 🔴 next up | `<PageShell>` · `<Timeline>` (scroll-beam Aceternity-style) · refine `<ConfirmDialog>` | — |
| 5 | **LineItems editor** | 🔴 queued | `<LineItemsEditor>` (edit-in-place · drag-reorder · borderless — user's fav) | — |
| 6 | **Form** | 🔴 queued | `<Stepper>` · `<InputRow>` · `<SelectRow>` · `<DateRow>` · `<MultiSelectRow>` · `<ManualOverrideToggle>` | — |
| 7 | **Settings** | 🔴 queued | composition-only (no new primitives) | — |
| 8 | **Tool / Calculator** | 🔴 queued | composition-only | — |
| 9 | **Atom polish** | 🔴 queued | Badge retrofit · refine `<Chip>` variants | — |
| 10 | **Progress bars** ← NEW | 🔴 queued | `<WorkflowProgressBar>` · `<ProgressCard>` (CDW / meetingprojects pattern) | — |
| 11 | **Spatial (map + canvas)** ← NEW | 🔴 queued | `<MapCanvas>` · `<SpatialPicker>` · `<DrawingModal>` (Leaflet + drafter draw tool) | — |
| 12 | **Integration cards** ← NEW | 🔴 queued | `<IntegrationCard>` family (NAS · Xero · email · webhook) | — |

**KpiTile + Chart** (originally planned in the 6-session roster under "Dashboard") are **out of scope for /dashboard** — that page is a module launcher, not an analytics dashboard. Moved to a future role-dashboards session when we migrate `/engineer-dashboard` · `/report-dashboard` · `/admin-overview`.

**W07 status after this pass**: Phase 1 ✅ shipped · Phase 2 🟡 IN PROGRESS (28 primitives live from sessions 1+2+S-shell+3; remaining from sessions 4-12 still pending). Full inventory tracked in [DESIGN_CATALOG.md](DESIGN_CATALOG.md).

After Session 4, W07 Phase 2 is effectively complete. Sessions 5 + 6 produce module-level patterns that W09 migration consumes without needing new primitives.

---

## Per-session spec

Each session produces **6 states × 2 themes = 12 design variants**:

| State | Purpose |
|---|---|
| Loading skeleton | Placeholder while data fetches |
| Empty | Zero-data state |
| Populated (normal) | Happy-path, realistic data |
| Populated (heavy) | 50+ rows / 20+ KPIs — stress-test density |
| Error | Network error / RLS denied / 500 |
| Filtered/active | User has filters/search applied |
| **× Theme** | Light + Dark for each of the 6 |

### Session 1 — List/Table archetype

- **Reference page**: /quotations (most complex list in the app)
- **Variety refs**: /clientprofiles (filter-heavy) · /payment-management (row-expand) · /emaillogs (dense)
- **Claude Design prompt**:
  ```
  Design the list/table archetype for AppBase per LOCKED_PICKS.md v1 DataTable
  + v3.3 Mobile pattern. Use /quotations as primary reference: 10–20 columns,
  server-paginated 100 rows/page, filter bar (search debounced 350ms + status
  multi-select + date range + company combobox), row-hover zinc-50, sort
  indicators on every header, pagination footer. Mobile <640px: 3-col stacked
  card-row (identifier + status/amount + date), NO horizontal scroll. Primary
  CTA slate-700, destructive red-700, brand accent red-700 (status badges,
  focus rings). Roboto body, Geist Mono tabular-nums on numeric columns.
  Generate all 6 states × light + dark.
  ```
- **W07 impact**: refine `<DataTable>`, build `<AppHeader>` glass, rebuild `<Button variant=primary>`, introduce `<FilterBar>`
- **W09 proof modules**: /quotations + /clientprofiles

### Session 2 — Dashboard archetype

- **Reference page**: /dashboard
- **Variety refs**: /engineer-dashboard (workload-heavy) · /report-dashboard (chart-heavy)
- **Claude Design prompt**:
  ```
  Design the dashboard archetype per LOCKED_PICKS v1 KpiTile (Tremor +
  NumberTicker) + v2 Charts (Tremor + Motion entrance). KPI tile grid: value
  with NumberTicker animation, delta badge (green-700/50 bg for positive,
  red-700/50 for negative), optional sparkline slot. Chart rows: area/bar
  per LOCKED_PICKS v2 palette (pipeline red-700, accepted green-600). Recent
  activity list below. Quick-action buttons. Responsive: 4-col → 2-col →
  1-col. 6 states × light + dark.
  ```
- **W07 impact**: build `<KpiTile>` + `<Chart>`
- **W09 proof modules**: /dashboard + /engineer-dashboard

### Session 3 — Detail page archetype

- **Reference page**: /quotations/:id (hero + tabs + side-rail + timeline)
- **Variety refs**: /projects/:id · /invoices/:id · /people/:id
- **Claude Design prompt**:
  ```
  Design the detail-page archetype. Hero header: breadcrumb + title + status
  badge (accent red-700) + primary actions (slate-700 + destructive red-700).
  Tabs: shadcn baseline (no redesign). Left-main content column + optional
  right side-rail (metadata/activity). Scroll-beam timeline pattern
  (LOCKED_PICKS v2) for status history. Mobile: tabs collapse to horizontal
  scroll, side-rail moves below main, sticky action bar at bottom. 6 states
  × light + dark.
  ```
- **W07 impact**: build `<Timeline>` + refine `<ConfirmDialog>`
- **W09 proof modules**: /quotations/:id + /projects/:id

### Session 4 — Form / Create archetype

- **Reference page**: /quotations/create
- **Variety refs**: /supervisor addworkentry (mobile-first) · ~~/projects/create~~ ([DEPRECATED 2026-05-25](./DEPRECATIONS.md) — now a modal, not a form-archetype route)
- **Claude Design prompt**:
  ```
  Design the form-create archetype. FormShell: section headers with rule,
  FieldRow = label left + input right on desktop, stacked on mobile. Inline
  validation errors (red-700 text, red-50 bg). Sticky SubmitBar at bottom
  (primary slate-700 + secondary ghost). Mobile-first at 375px with 44px tap
  targets. Stepper chip pattern (LOCKED_PICKS v2 animated-chip) for multi-step
  flows. vaul drawer for mobile pickers (LOCKED_PICKS v2 + handle pulse).
  6 states × light + dark.
  ```
- **W07 impact**: build `<Stepper>` + `<MobileDrawer>`, refine `<FormShell>` / `<FieldRow>` / `<SubmitBar>`
- **W09 proof modules**: /quotations/create + /supervisor addworkentry

### Session 5 — Settings / Config archetype

- **Reference page**: /quotationsettings (tab + list + editor split)
- **Variety refs**: /pdftemplates (upload + preview) · /xerosettings (OAuth)
- **Claude Design prompt**:
  ```
  Design the settings archetype. Top tab navigation. Split-pane: left list of
  items (with EmptyState for zero items), right editor panel. Save-as-you-go
  vs explicit-save per section. Upload dropzone pattern (drag + click). OAuth-
  connect card pattern. 6 states × light + dark.
  ```
- **W07 impact**: refine `<EmptyState>` patterns
- **W09 proof modules**: /quotationsettings + /xerosettings

### Session 6 — Tool / Calculator archetype

- **Reference page**: /ot-calculator
- **Variety refs**: /jltt · /performance-review
- **Claude Design prompt**:
  ```
  Design the tool/calculator archetype. Input-heavy left column + prominent
  live-computed output panel right. Output emphasizes numbers (Geist Mono,
  tabular-nums, large size). Input groups with clear section headers. Mobile:
  input on top, output becomes sticky bottom panel. 6 states × light + dark.
  ```
- **W07 impact**: none new (composition of existing primitives)
- **W09 proof modules**: /ot-calculator + /performance-review

---

## Timeline estimate

| Session | Your time in Claude Design | My implementation time | Review cycles |
|---|---|---|---|
| 1 List/Table | 60–90 min | 2–3 hrs (DataTable refine + AppHeader + Button + FilterBar + 2 proof modules) | 2–3 |
| 2 Dashboard | 45–60 min | 2 hrs (KpiTile + Chart + 2 proof modules) | 2 |
| 3 Detail | 45–60 min | 2 hrs (Timeline + 2 proof modules) | 2 |
| 4 Form | 30–45 min | 1.5 hrs (Stepper + Drawer + 2 proof modules) | 2 |
| 5 Settings | 30 min | 1 hr (2 proof modules) | 1–2 |
| 6 Tool | 30 min | 1 hr (2 proof modules) | 1–2 |
| **Total** | **~4–5 hours of you** | **~10–12 hours of me** | **~10–12 rounds** |

Then W09 mass migration consumes the archetypes across 68 remaining pages — weeks, but mechanical.

---

## Staging folder pattern

Per-session scratch folder in the repo. Your Claude Design export lives here; I read from here; I commit the folder alongside the implementation so we have an audit trail.

```
docs/99-refactor/_system/design/
├── session-01-list-table/
│   ├── README.md                   ← per-session brief (I prep before each session)
│   ├── screenshots/                ← you drop 12 images here
│   │   ├── 01-loading-light.png
│   │   ├── 02-empty-light.png
│   │   ├── 03-populated-light.png
│   │   ├── 04-populated-heavy-light.png
│   │   ├── 05-error-light.png
│   │   ├── 06-filtered-light.png
│   │   ├── 07-mobile-stacked-light.png
│   │   └── ...-dark.png variants
│   ├── export/                     ← unzipped Claude Design handoff bundle
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── components/
│   ├── decisions.md                ← your 5–10 bullet natural-language lock
│   └── claude-design-url.txt       ← share URL if public, else reference
├── session-02-dashboard/
└── ... (one per archetype)
```

## The handoff loop (per session)

```
1. I prep context                    (30 sec ahead of each session)
   → docs/99-refactor/_system/design/session-NN-<archetype>/README.md
     with your prompt, reference files, expected states

2. YOU → Claude Design                (your time, live iteration)
   → open claude.ai/design → new chat
   → paste prompt from README
   → iterate via comments / sliders / direct edits
   → export handoff bundle (URL or zip)

3. YOU stage                          (3 min)
   → drop 12 screenshots + export/ + decisions.md into the folder

4. YOU ping me                        (1 line in chat)
   → "Session N done. Staged in session-NN-<archetype>/"

5. I read + distill                   (10 min)
   → Read decisions.md
   → Look at each screenshot (I see images directly)
   → Read HTML/CSS export
   → Map to: token changes (W08) + primitive impl (W07) + proof modules (W09)

6. I implement                        (1.5–3 hrs)
   → commit 1: W08 token refinements
   → commit 2: W07 primitive(s) built/refined
   → commit 3: W09 2 proof modules migrated
   → commit 4: W08 card Phase 3 session-N ✅

7. YOU review dev server              (~15 min)
   → visual check on proof modules + 3 sibling routes
   → approve OR redirect ("too tight" / "wrong shadow" / etc.)

8. Iterate if redirect, else next session.
```

## Handoff channels (what I can read)

| Channel | How you produce | How I consume | Best for |
|---|---|---|---|
| Local file | Save in staging folder | `Read` tool | HTML/CSS, decisions.md, handoff zips |
| Screenshot | cmd-shift-4 → drag into chat OR staging folder | Vision | Visual reference, layout, spacing |
| Pasted text | Copy from Claude Design → paste in chat | Inline | Component snippets, lock-decisions |
| Public URL | Claude Design "publish" if offered | `WebFetch` | TBD — verify in Session 1 |

**claude.ai/design URLs are auth-gated** — I CANNOT fetch them directly. Handoff MUST go through local files + pasted images/text.

## Fastest shortcut (if export is painful)

Minimum viable handoff per session:
- 10 screenshots pasted in chat (most informative states, 2 themes)
- 1 paragraph of decisions pasted in chat

I can implement from this. Staging folder is the thorough version (audit trail + future reference); chat-only is faster. Your call per session.

---

## Pre-flight for Session 1

Before Session 1 starts:

1. ✅ **Primary CTA colour LOCKED 2026-04-19 at slate-700 `#334155`** (10.7:1 WCAG AAA). Brief slate-500 override (4.14:1 borderline AA) reverted; LOCKED_PICKS v3.1 amended zinc-700 → slate-700. No further pre-flight decision needed for CTA.
2. **Curated code bundle** — run:
   ```bash
   BUNDLE=~/Desktop/appbase-design-bundle
   rm -rf "$BUNDLE" && mkdir -p "$BUNDLE"
   cd /Users/tanweijie/repo/AppBase/trench-trace-portal-app
   rsync -a --relative \
     src/index.css \
     src/lib/design/ \
     src/components/ui/ \
     src/components/DashboardHeader.tsx \
     src/features/design-lab/ \
     src/features/staff-management/ \
     src/pages/Dashboard.tsx \
     src/pages/QuotationList.tsx \
     src/pages/ClientProfilesPage.tsx \
     src/pages/ProjectList.tsx \
     docs/99-refactor/_system/LOCKED_PICKS.md \
     docs/99-refactor/_system/workflows/W08_DESIGN_SYSTEM.md \
     docs/99-refactor/_system/CLAUDE_DESIGN_GAME_PLAN.md \
     "$BUNDLE/"
   open "$BUNDLE"
   ```
3. **Reference apps you'd like cited** (optional) — e.g., "I love Linear's issue list" or "Vercel Dashboard feels right". If you skip, I'll seed the Session 1 prompt with Linear + Vercel + Stripe as default anchors.
4. **Upload bundle + fonts + LOCKED_PICKS to Claude Design setup form** using the drafts already written in conversation (company blurb + other-notes paragraph).

When all 4 are done, paste "Session 1 setup complete" — I'll write the Session 1 staging folder README with the exact prompt, ready for you to paste into Claude Design.

---

## Card status after this doc

| Card | Before | After |
|---|---|---|
| W08 | 🟡 Phase 1 + 2 done · Phase 3 = "motion primitives + /design-system page" | 🟡 Phase 1 + 2 done · **Phase 3 = Claude Design sessions** (this doc) · Phase 4 = motion + reference page (deferred) |
| W07 | 🟡 Phase 1 done · Phase 2 = KpiTile/Chart/Timeline/Stepper/Drawer/AppHeader | 🟡 Phase 1 done · **Phase 2 BLOCKED on W08 Phase 3 session output** |
| W09 | 🟡 /serviceslist pilot | unchanged — awaits W07 Phase 2 complete |

## Terminal exit

Phase 3 is complete when:
- All 6 sessions shipped with handoff bundles + implementation commits
- W07 Phase 2 primitives all built to archetype spec
- Each archetype has 2+ proof modules migrated (W09 partial)
- User signs off: "yes this is the direction" per [W08_DESIGN_SYSTEM.md](workflows/W08_DESIGN_SYSTEM.md) done-when

W08 flips 🟡 → 🟢 when W09 consumes the remaining 68 pages against the archetype specs (not before).
