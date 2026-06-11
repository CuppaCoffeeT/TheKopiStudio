# W08 — Design system baseline

**Goal**: Research + define the visual language (tokens, fonts, motion, mobile grid, dark mode) that makes AppBase look like a million dollars instead of AI slop.
**Tier**: Next · **Status**: 🟡 IN PROGRESS (Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ **70/70 primitives designed via targeted pivot** — S1 · S2 · S-shell · S3 · S4a shipped through sessions; Form + DataTable + Charts + AppHeader-v2 shipped via direct prompts on 2026-04-20 eod+2 instead of full sessions). · **Last Updated**: 2026-04-20 SGT eod+2 · **Automation**: 👀 HITL
**Blocked by**: ~~UI/UX research~~ ✅ · ~~W17 picks~~ ✅ · **Blocks**: W09 adoption of the 70-primitive kit. **Flips 🟢 when**: W09 migrations consume the design kit end-to-end (≥5 page migrations with visual-verify gates green).

## Why this exists

User quote: "currently it feels very AI slob generic font no animation all the typical component... look minimalistic but everywhere animation, non AI slop fonts, mobile friendly and look like a million dollar". Shared primitives (W07) without a design language just codify the slop. This card resets the visual baseline and makes W09 migration also a visual upgrade.

## Scope

**In (Phase 1 ✅ 2026-04-19):**
- Tailwind v3 → v4 infra migration
- Token file `src/lib/design/tokens.ts` (deep-import exports per Q-W07-b)
- `@theme` block in `src/index.css` with full LOCKED_PICKS v1/v2/v3 token set + Radix zinc + red 1–12 scales + motion tokens
- Dark-mode variants for every colour token (class-strategy, scoped to /design-lab only in Phase 1)
- Font install + `/design-lab/fonts` 3-way comparison lab (Roboto · Geist Mono · Geist Pixel)
- ThemeProvider at `src/lib/design/ThemeProvider.tsx` (light · dark · system · persisted)
- Formal deprecation of DESIGN_SYSTEM.md

**In (Phase 2 ✅ 2026-04-19 — shipped):**
- ✅ Q-W08-a font locked: **Roboto** body + UI · **Geist Mono** tabular + code · **Geist Pixel** reserved (opt-in via `--font-pixel`). `@fontsource/*` hoisted from lab-only to `src/main.tsx`; `body { font-family: var(--font-sans) }` in base layer.
- ✅ Shadcn semantic tokens remapped in `:root` + `.dark` (one change hits 400+ components): `--primary` → **slate-700 `#334155` (hsl 215 25% 27%)** — user final pick 2026-04-19 (brief eod+8 slate-500 trial reverted on contrast: 4.14:1 borderline AA → slate-700 at 10.7:1 WCAG AAA); LOCKED_PICKS v3.1 amended zinc-700 → slate-700 · `--destructive` → red-700 (darker, brand-aligned) · `--ring` → red-700 (brand focus).
- ✅ ThemeProvider hoisted from DesignLabPage to `src/App.tsx` root; flips `document.documentElement.classList` (not a wrapper), so every page respects dark mode. Persisted to `localStorage:w08:theme:v1`.
- ✅ `ThemeToggle` widget in `src/lib/design/ThemeToggle.tsx` cycles system → light → dark → system; placed in `DashboardHeader` (desktop + mobile) — every page gets it via that single location.
- ✅ Base-layer tokens: heading scale h1-h6 (tight leading + negative letter-spacing, Linear/Vercel-inspired) · link colour (red-700 brand) · `:focus-visible` outline (red-700 brand ring) · `code/kbd/pre/samp { font-family: var(--font-mono) }`.
- ✅ 7 shadcn `src/components/ui/*` files retrofit — hardcoded `bg-white`/`text-gray-*`/`border-gray-*`/`bg-red-500` swapped to `bg-background`/`text-muted-foreground`/`border-border`/`bg-destructive`. Files: dialog.tsx · count-badge.tsx · loading-states.tsx · accessible-components.tsx · people-select.tsx · available-people-select.tsx · project-select-with-validation.tsx.
- ✅ Violation audit: `W08_PHASE_2_VIOLATIONS.md` catalogues 5,556 sites across ~500 files (289 files × `bg-gray/white/black` · 338 × `text-*` · 185 × `border-gray-*` · 305 × hardcoded `rounded-*` · 119 × raw `transition-*` for Q-W08-b review · 40 × `shadow-*` · 17 × hex literals). Top-20 offenders concentrate in project-management + quotation + payment-management + performance-review. Forecast: W07 primitives absorb ~1,500–2,000 sites; W09 per-module migration eats the ~2,400 residue.
- ✅ Verification: `tsc --noEmit` ✅ · `npm run build` ✅ (CSS 270.90 → 271.74 kB) · Playwright seatbelt 16/16 green chromium-desktop (auth/login-admin + smoke/all-modules + clientprofiles).

**In (Phase 3 🔵 PLANNED — Claude Design archetype sessions, BLOCKS W07 Phase 2 + W09):**

Full game plan: [CLAUDE_DESIGN_GAME_PLAN.md](../CLAUDE_DESIGN_GAME_PLAN.md). 6 sessions × archetype-level visual spec in [claude.ai/design](https://claude.ai/design). Each session produces a handoff bundle (screenshots + decisions.md + optional HTML/CSS export) that I translate into: (a) W08 token refinements, (b) W07 primitive(s) built/refined to spec, (c) W09 proof-of-concept migrations (2 reference modules per session).

Session plan (see game plan doc for full details):

| # | Archetype | Modules covered | W07 primitives unblocked |
|---|---|---|---|
| 1 | List/Table | 26 routes (/quotations · /clientprofiles · /projectlist · /claims · /invoices · etc.) | refine `<DataTable>` · build `<AppHeader>` glass · rebuild `<Button variant=primary>` · new `<FilterBar>` |
| 2 | Dashboard | 11 routes (/dashboard · /engineer-dashboard · /report-dashboard · etc.) | build `<KpiTile>` · build `<Chart>` |
| 3 | Detail page | 12 routes (/quotations/:id · /projects/:id · /people/:id · etc.) | build `<Timeline>` · refine `<ConfirmDialog>` |
| 4 | Form / Create | 8 routes (/quotations/create · /supervisor addworkentry · etc.) | build `<Stepper>` · build `<MobileDrawer>` · refine form primitives |
| 5 | Settings / Config | 7 routes (/quotationsettings · /pdftemplates · etc.) | refine `<EmptyState>` |
| 6 | Tool / Calculator | 6 routes (/ot-calculator · /jltt · /performance-review · etc.) | — (composition only) |

After Session 4, W07 Phase 2 is effectively complete. Sessions 5 + 6 inform W09 patterns.

**In (Phase 4 — follow-ups, NOT blocking W09):**
- Motion primitives package at `src/components/motion/` (per Q-W08-b RESERVED — only a handful of components, opt-in)
- `/design-system` reference page rendering every token + atom + motion sample
- ✅ Formal LOCKED_PICKS.md v3.1 amendment for primary CTA — **slate-700 `#334155`** locked 2026-04-19 (after brief slate-500 trial reverted on contrast)

**Out:**
- Any W07 primitive — `<Card>`, `<DataTable>`, `<Button>` wraps are W07's job
- Per-module migration (W09)
- Illustration/icon system — separate pass if time

## Dependencies on other cards

- Needs best-practices research complete ✅
- Consumes W17 picks (LOCKED_PICKS.md) ✅
- Referenced by W07 (primitives style themselves via tokens)
- Consumed by W09 (migration reskins as it moves)

## Phase 3 — Per-session tracker (design output)

Each row is ONE Claude Design session — W08 owns the **design spec**, W07 owns the matching **primitive implementation** (see [W07 tracker](W07_SHARED_PRIMITIVES.md#phase-2--per-session-primitive-build-tracker-implementation)). Paired with [CLAUDE_DESIGN_GAME_PLAN.md](../CLAUDE_DESIGN_GAME_PLAN.md) and [DESIGN_CATALOG.md](../DESIGN_CATALOG.md) "Sessions" table.

### W08 per-session steps (all 5 must ✅ for Designed 🟢)

1. Claude Design session kicked off in [claude.ai/design](https://claude.ai/design) with the locked prompt template
2. Design bundle exported + unpacked to `design/session-##-<slug>/export/appbase/project/`
3. Spec reviewed in-browser (user-approved) — no outstanding "redo" feedback
4. Token refinements (if any) added to `src/index.css` under the `@theme` block
5. DESIGN_CATALOG "Sessions" row + affected primitive rows flipped **Designed 🟢** + commit with `docs(catalog):`

### Status

| # | Session | Archetype scope | Design bundle | User-approved | Token deltas | Catalog synced | **Designed** |
|---|---|---|---|---|---|---|---|
| S1 | **List/Table** | `/quotations`, `/clientprofiles`, `/projectlist`, +23 list routes | ✅ `design/session-01-list-table/` | ✅ | ✅ status-badge palette × L+D · `--brand-red` flip | ✅ | **🟢** |
| S2 | **Overlays** | Modal · Drawer · Popover · Tooltip · Dropdown · ContextMenu · Alert · Toast · picker · ⌘K | ✅ `design/session-02-overlays/` | ✅ | ✅ glass tokens + backdrop-blur scales | ✅ | **🟢** |
| S-shell | **App shell + Phase A atoms + states** | Global chrome — every page | ✅ `design/session-shell-app-header/` | ✅ | ✅ sticky header + impersonation banner + ErrorState/NoResults 404 aesthetic | ✅ | **🟢** |
| S3 | **Dashboard** (module launcher) | `/dashboard` | ✅ `design/session-03-dashboard/` | ✅ | ✅ Greeting heading scale + ModuleCard shadow | ✅ | **🟢** |
| S4a | **Detail — Heavyweight** (5 pages · 8,000+ LOC) | `/projects/:id` · `/invoices/:id` · `/peoplemanagement/:id` · `CompanyDetailView` · `/quotations/:id` | ✅ `design/handoffs/2026-04-20-iV8W8LYb/` (LineItemsEditor split-cols) | ✅ | ✅ 9 primitives + DetailPageFrame wrapper at `src/components/primitives/detail/` | ✅ | **🟢 WAVE 1 shipped · adoption via /w09-migrate next** |
| S4b | **Detail — Medium** (3 pages · 1,360 LOC) | `/progress-claims/:id` · `/contacts/:id` · `/xeroinvoice/:id` | ⚫ deferred — reuse S4a primitives via `/w09-migrate` | — | — | — | **⚫ DEFERRED** — no new design needed; covered by DetailPageFrame + S4a primitive kit |
| S4c | **Detail — Light** (5 pages · 792 LOC) | `/engineer-project-detail/:id` · `/hr-applications/:id` · `/email-threads/:id` · `/claims/:id` · `/quotations/:id` (light) | ⚫ deferred — reuse S4a primitives | — | — | — | **⚫ DEFERRED** — same kit as S4b |
| S5 | **LineItems editor** | Quotation · invoice · progress-claim item tables | ✅ shipped inside S4a (`LineItemsEditor` primitive · split-col code/name/description) | ✅ | ✅ | ✅ | **🟢 (via S4a)** |
| S6 | **Form** (Input · Textarea · Select · Checkbox · Radio · Switch · DatePicker · FileUpload · Field · Progress · Stepper) | `/quotations/create` · `/supervisor addworkentry` · +6 form routes | ✅ `handoffs/2026-04-20-nl73fwyg/` (FormPrimitives.html · 11 primitives) + `13pEBoyg/` (Stepper dot-shrink) | ✅ | ✅ form kit at `src/components/primitives/form/` (11 files) · 2026-04-20 eod+2 | ✅ | **🟢 — promoted direct, no full session** |
| S7 | **Settings** (composition) | `/quotationsettings` · `/emailsettings` · +5 settings routes | ⚫ composition-only — uses existing form + detail kits | — | — | — | **⚫ COMPOSITION-ONLY** — no new primitives needed |
| S8 | **Tool** (composition) | `/ot-calculator` · `/jltt` · `/leaves` · `/payslip` · +2 tool routes | ⚫ composition-only | — | — | — | **⚫ COMPOSITION-ONLY** |
| S9 | **Atom polish** (Badge · Kbd · Chip variants · Avatar formalise) | Reskin pass across primitives | ✅ shipped incrementally across S1-S4a (no dedicated session) | ✅ | ✅ | ✅ | **🟢** |
| S10 | **Progress** — `<Progress>` primitive only | CDW tab · meetingprojects · cable-detection · project summary | ✅ `handoffs/2026-04-20-nl73fwyg/` FormPrimitives.html includes Progress (bar · 4 tones) | ✅ | ✅ at `src/components/primitives/form/Progress.tsx` | ✅ | **🟢 for bar-only** · WorkflowProgressBar + ProgressCard compositions ⚫ deferred — build on-demand when CDW W09 lands |
| S11 | **Spatial** (MapCanvas · SpatialPicker · DrawingModal) | Plan-purchase · CDW · drafter · project-overview maps | ⚫ deferred — build on-demand when W09 spatial page migrates | — | — | — | **⚫ DEFERRED** — no forcing W09 page blocked on it yet |
| S12 | **Integration** (IntegrationCard) | NAS folder · Xero · email-account · webhook setup | ⚫ deferred — build on-demand | — | — | — | **⚫ DEFERRED** |
| S3b | **Role dashboards** — Chart family shipped · KpiTile skipped per user pick | Admin · Engineer · Drafter · +7 role dashboards | ✅ Chart family `handoffs/2026-04-20-nl73fwyg/` ChartPrimitives.html (ChartShell · AreaChart · BarChart · HBarChart · ChartTooltip · ChartLoading · ChartError · LegendRow) | ✅ | ✅ at `src/components/primitives/charts/` (8 files) · 2026-04-20 eod+2 | ✅ | **🟢 for charts** · KpiTile explicitly deferred (user pick) — use Chart + StatusBadge compositions instead |
| S1b | **DataTable kit** — split from S1 because table layer needed its own prompt | All 88 list routes | ✅ `handoffs/2026-04-20-nl73fwyg/` DataTablePrimitives.html (DataTable · TableHeader · DataRow · SortIcon · TableCheckbox · Pagination · PageBtn · MobileListCard + shell FilterPill) | ✅ | ✅ at `src/components/primitives/ui/` (8 files) + `shell/FilterPill.tsx` · 2026-04-20 eod+2 | ✅ | **🟢** |
| S-shell-v2 | **AppHeader redesign** — glass opacity · pixel lockup · Bell-first right cluster · mobile back-chevron | Every page | ✅ `handoffs/2026-04-20-FmPJtwZw/component-header.html` | ✅ | ✅ patched `src/components/primitives/shell/AppHeader.tsx` · 2026-04-20 eod+2 | ✅ | **🟢** |

**All 15 session equivalents delivered 🟢** (including ⚫ deferrals for composition-only + deferred specialized kits). No session gates remain — any future primitive need is handled on-demand via direct `/design-prompt` + `/design-import --promote` rather than a full archetype session. **Design intention is now adoption-gated**: the 70-primitive kit is ready; W09 drives the migrations; visual parity enforced by `.claude/rules/design-system.md` + `/design-lab/*` labs + `/refactor-dashboard → Primitives` tab.

### Plan pivot (2026-04-20 eod+1 → delivered eod+2)

User decided to STOP running full Claude Design archetype sessions. Instead: **3 targeted micro-items** to cover known gaps, then full focus on W09 migrations via `/w09-migrate` skill. **All 3 micro-items delivered on 2026-04-20 eod+2 — plus the plan expanded mid-flight to cover the full form + table + chart kits and an AppHeader redesign**, because the user ran one big `/design-prompt` that scoped all three primitive families in a single Claude Design session.

| Micro-item | Effort | Status | Delivered |
|---|---|---|---|
| **Promote Stepper** | ~15 min | ✅ DONE eod+2 | From handoff `2026-04-20-13pEBoyg/project/preview/component-stepper.html` → `src/components/primitives/form/Stepper.tsx` (93 lines, 3 states, dark mode). MANIFEST flipped staged → promoted. |
| **Mini chat: S10 Progress** | ~1 hr | ✅ PARTIAL eod+2 | `<Progress>` primitive shipped inside FormPrimitives (bar with 4 tones). `<WorkflowProgressBar>` + `<ProgressCard>` compositions ⚫ deferred — build on-demand when CDW or meetingprojects W09 page lands. |
| **Mini chat: S6 Form FormRows** | ~1 hr | ✅ EXCEEDED eod+2 | `<Field>` primitive (label + input slot + helper/error + required marker) covers the FormRow/FormField/FormSection concept. Full form kit shipped alongside: 11 primitives (Input · Textarea · Select · Checkbox · Radio · Switch · DatePicker · FileUpload · Field · Progress · Stepper). |

**Bonus beyond plan (eod+2)**: full DataTable kit (9 primitives under `ui/` + FilterPill in shell) + full Chart kit (8 primitives under `charts/`) + AppHeader redesign per handoff `FmPJtwZw` (pixel lockup · Bell-first · 6px gap · glass 72/70). Total day delta: **44 → 70 primitives built + designed**, 0 pending promote.

After these: full pivot to W09 page-migrations via `/w09-migrate`. CompanyDetail is W09 #2 live. Remaining detail pages (PersonDetail · InvoiceDetail · QuotationDetail · ProjectDetail) queued as parallel agent launches.

**Deferred indefinitely** (not blocking anything today): S4b Medium detail pages · S4c Light detail pages (both use existing S4a primitives — no new design needed · migrate via `/w09-migrate` directly) · S7 Settings · S8 Tool · S9 Atom polish · S11 Spatial (only triggers when CDW/spatial touched) · S12 Integration · S3b Role-dashboards.

## S4a game plan — detail-page heavyweights

5 pages in scope: ProjectDetail (50 WF) · InvoiceDetail (27) · PersonDetail (17) · CompanyDetail (20) · QuotationDetail (24) = **141 WF rows captured**.

### Why STEP 2 comes before STEP 4 (not 5 parallel chats from day one)

Risk if all 5 page-chats run in parallel from day one: each invents its own `<Timeline>`, `<TabNav>`, `<LineItemsEditor>` — shared primitives drift between 5 bundles, then W07 has to reconcile 5 visual languages into one library. That's the failure mode DETAIL_PAGES_AUDIT called out.

Fix: **STEP 2 first** (1 chat designs the 9 shared primitives), then **STEP 3** builds them, then **STEP 4** (5 parallel chats compose each page from the pre-designed primitives).

### Where we are (task tree — plain English)

```
AppBase Refactor (5-week · 11 W## cards)
  └─ W08 Design System Baseline
       └─ Phase 3: Claude Design archetype sessions (15 sessions)
            └─ S4 Detail page archetype (3 tiers)
                 │
                 ├─ S4a  HEAVYWEIGHT (5 biggest detail pages)
                 │    │
                 │    ├─ STEP 1 · RESEARCH: capture every click on the 5 pages
                 │    │    └─ 🟢 DONE 2026-04-19 — 141 workflows captured by 5 parallel agents
                 │    │
                 │    ├─ STEP 2 · DESIGN SHARED  (1 Claude Design chat) 🟢 DONE 2026-04-20
                 │    │    Find the 9 patterns duplicated across all 5 pages · design ONE version each.
                 │    │    │
                 │    │    ├─ 🟢 Evidence bundle at input/00-shared-primitives/ (7 src + 5 workflows + PROMPT)
                 │    │    ├─ 🟢 Claude Design chat run · 2 full-system snapshots staged
                 │    │    └─ 🟢 Final URL: handoffs/2026-04-20-iV8W8LYb (LineItemsEditor split-cols variant)
                 │    │
                 │    ├─ STEP 2.5 · W23 STAGE + PREVIEW 🟢 SHIPPED 2026-04-20
                 │    │    Full-system snapshot staging at docs/.../handoffs/<date>-<hash>/ + lab
                 │    │    preview at /design-lab/handoffs. See [W23](W23_DESIGN_LAB_HANDOFF_STAGING.md).
                 │    │    │
                 │    │    ├─ 🟢 /design-import skill (STAGE + --promote · latest-URL prompt)
                 │    │    ├─ 🟢 /design-prompt skill (flow hints)
                 │    │    ├─ 🟢 /design-lab/handoffs route + Vite plugin + 3-panel UI
                 │    │    ├─ 🟢 Staged 2026-04-20-MUmgnpT1 (initial S4a export)
                 │    │    └─ 🟢 Staged 2026-04-20-iV8W8LYb (LineItemsEditor edit re-export)
                 │    │
                 │    ├─ STEP 3 · BUILD SHARED 🟢 DONE 2026-04-20
                 │    │    9 primitives + DetailPageFrame wrapper at src/components/primitives/detail/
                 │    │    │
                 │    │    ├─ 🟢 Background agent promoted 9 primitives (2,318 LOC JSX → TSX)
                 │    │    ├─ 🟢 Both MANIFESTs flipped status → "promoted"
                 │    │    ├─ 🟢 DetailPageFrame wrapper built (one-stop API · flat props · shim pattern)
                 │    │    ├─ 🟢 Visual-verify lab at /design-lab/heavyweight-detail
                 │    │    ├─ 🟢 3 post-hoc fixes: ActivityLog types · LineItemsEditor 9-col grid · AppHeader-breadcrumb convention
                 │    │    └─ 🟢 tsc + build green · primitives/CONTEXT.md + DESIGN_CATALOG updated
                 │    │
                 │    ├─ STEP 3.5 · W11.03 PRIMITIVES DASHBOARD 🟢 SHIPPED 2026-04-20
                 │    │    Live /refactor-dashboard → Primitives tab with preview thumbnails +
                 │    │    Designed/Built/Live + 🚢 adoption counts + Copy promote cmd.
                 │    │    See [W11.03](W11.03_PRIMITIVES_ADOPTION_DASHBOARD.md).
                 │    │    │
                 │    │    ├─ 🟢 scripts/primitives-manifest-builder.mjs + CLI wrapper
                 │    │    ├─ 🟢 Vite middleware at /api/primitives-manifest (scans + greps live)
                 │    │    ├─ 🟢 Primitives tab — preview iframes + group chips + filters
                 │    │    └─ 🟢 Adopter classifier: prod / lab / test — "Live" = real-production only
                 │    │
                 │    ├─ STEP 4 · DESIGN PER-PAGE  (5 parallel Claude Design chats) ← WE ARE HERE
                 │    │    Each chat composes DetailPageFrame + designs 2-3 page-specific atoms ONLY.
                 │    │    CDW+Spatial mapping explicitly deferred to S11 Spatial session.
                 │    │    │
                 │    │    ├─ 🟢 5 per-page evidence bundles ready (BUNDLE_README + src-snapshot + workflows)
                 │    │    ├─ 🔴 5 per-page PROMPT.md not yet written
                 │    │    ├─ Scope per chat:
                 │    │    │    · ProjectDetail → NASFolderMappingCard atom
                 │    │    │    · InvoiceDetail → PaymentSummaryCard atom
                 │    │    │    · PersonDetail → PersonRoleStatusPanel + WhatsAppThreadPanel atoms
                 │    │    │    · CompanyDetail → compact RelatedRecordsCard variant
                 │    │    │    · QuotationDetail → AgentPromptCard + CompetitorPricingCard atoms
                 │    │    └─ 🔴 5 chats not run
                 │    │
                 │    └─ STEP 5 · BUILD + MIGRATE EACH PAGE  (W07 page atoms + W09)
                 │         5 pages adopt DetailPageFrame · promote page atoms · wire data · Playwright.
                 │         ProjectDetail parallels W13 code split. CDW+Spatial stays legacy until S11.
                 │         │
                 │         └─ 🔴 not started (blocked on STEP 4 page-spec outputs)
                 │
                 ├─ 🔴 S4b  MEDIUM (3 pages · progress-claims · contact · xero-invoice)
                 │    └─ queued after S4a
                 │
                 └─ 🔴 S4c  LIGHT (5 pages · engineer-project · hr-applications · email-threads · claims · quotations-simple)
                      └─ queued after S4b
```

### Legend — what each STEP actually means

| STEP | Owner | Means |
|---|---|---|
| 1 Research | me + 5 agents | Read code + walk page · list every workflow per page |
| 2 Design shared | user (chat) + me (prep) | 1 Claude Design chat · produces 9 primitive specs (PageShell · TabNav · Timeline · StatusTransitionModal · RelatedRecordsCard · ActivityLogTimeline · SendEmailDialog · LineItemsEditor · DestructiveConfirmDialog) |
| 3 Build shared | me · W07 | Code those 9 primitives in React at `src/components/primitives/detail/` |
| 4 Design per-page | user (chats) + me (prep) | 5 parallel Claude Design chats · each designs ONE page's layout using the 9 primitives as inputs |
| 5 Build + migrate | me · W07+W09 | Code page-specific atoms · wire real Supabase data · write Playwright · archive legacy |

### STEP 1 · Research + evidence bundle 🟢 DONE

Per-page input bundles at `design/session-04-detail/input/`:

```
design/session-04-detail/
├── README.md
└── input/
    ├── 00-shared-primitives/
    │   ├── PROMPT.md                 🟢 written
    │   ├── BUNDLE_README.md          🟢 written
    │   ├── src-snapshot/ (7 tsx)     🟢 done (InvoiceLineItemsTable · DraggableLineItems · QuotationAuditLog · AuditLogViewer · SendInvoiceEmailDialog · DeleteProjectDialog · QuotationDeleteDialog)
    │   ├── workflows/ (5 md)         🟢 done (copies of 5 per-page workflows.md)
    │   ├── screenshots/              🟡 1 of 5 (ProjectDetail desktop only — fill rest before STEP 4)
    │   └── duplication-clusters.md   🟢 copied from research/
    ├── 01-projectdetail/  🟢 FULL    · BUNDLE_README + 10 tsx (ProjectDetailPage + 9 tabs) + workflows
    ├── 02-invoicedetail/  🟢 MEDIUM  · BUNDLE_README + 5 tsx  (shell + line items + record pay + send email + activity) + workflows
    ├── 03-persondetail/   🟢 LIGHT   · BUNDLE_README + 2 tsx  (page + WhatsApp panel) + workflows
    ├── 04-companydetail/  🟢 LIGHT   · BUNDLE_README + 2 tsx  (view + contacts list) + workflows
    └── 05-quotationdetail/ 🟢 FULL   · BUNDLE_README + 11 tsx (shell + UnifiedQuotationView + 9 key comps) + workflows
```

**Adaptive bundle shape rule** — each per-page bundle has the minimum needed to brief a stranger on that page. Full shape only if the page justifies it:

| Bundle shape | Contents | Applies to | Why |
|---|---|---|---|
| **MINIMUM** | `BUNDLE_README.md` + `workflows.md` | (baseline for every page) | Covers intent + every workflow |
| **LIGHT** | + `src-snapshot/` (1-2 files · full page tsx) + 1 screenshot | PersonDetail (1,255 LOC) · CompanyDetail (803 LOC) | Page fits in one upload; one shot shows default state |
| **MEDIUM** | + `src-snapshot/` (3-5 files · shell + key sub-components) + 1-2 screenshots | InvoiceDetail (2,128 LOC) | Line-items table + Xero cards need to be seen, but 5 files is enough |
| **FULL** | + `src-snapshot/` (8-12 files · shell + all tab components) + screenshots (every tab) | ProjectDetail (3,002 LOC · 10 tabs · spatial map) · QuotationDetail (3,048 LOC monolith + 31 sub-components) | Page is too big or too tabbed to brief without seeing multiple surfaces |

Don't upload what isn't needed — Claude Design has a context ceiling + token cost per chat. Save full shape for pages where it earns its keep.

### STEP 2 · Design shared 🟡 IN PROGRESS (1 Claude Design chat · 2-3 days)

User pastes `PROMPT.md` into [claude.ai/design](https://claude.ai/design) · uploads the shared-primitives bundle · iterates on 12 consistency decisions.

**Chat outputs** (to be exported to `design/session-04-detail/00-shared-primitives/export/`):

- `Heavyweight Detail Archetype.html` — showcase page (all 9 primitives × 5 states × 2 themes)
- `detail/PageShell.jsx`
- `detail/TabNav.jsx`
- `detail/Timeline.jsx`
- `detail/StatusTransitionModal.jsx`
- `detail/RelatedRecordsCard.jsx`
- `detail/ActivityLogTimeline.jsx`
- `detail/SendEmailDialog.jsx`
- `detail/LineItemsEditor.jsx`
- `detail/DestructiveConfirmDialog.jsx`

**Blocker**: first attempt on 2026-04-19 hit Claude Design usage limit. Resumes Sun noon.

### STEP 3 · Build shared (me · W07 · 2-3 days)

- Build 9 primitives at `src/components/primitives/detail/`
- Export via `detail/index.ts`
- Visual-verify at `/design-lab/overlays` (extend the lab page with a "Detail" section)
- `tsc` + `build` + update `primitives/CONTEXT.md` + DESIGN_CATALOG Sessions row S4a-0 🟢

### STEP 4 · Design per-page (5 parallel Claude Design chats · 1-2 days each)

Per-page prompts at `design/session-04-detail/0N-<page>/PROMPT.md` · each imports the STEP 2 primitives as inputs ("use the pre-designed `<PageShell>` and `<TabNav>`…"). 5 chats run in parallel; each exports to `design/session-04-detail/0N-<page>/export/`.

### STEP 5 · Build + migrate each page (me · W07 + W09 · ~1 day per page)

Per page:
1. Build any page-specific primitives (EmploymentStatusSelector · PaymentSummaryCard · CompetitorPricingCard · etc.)
2. W09-migrate the page to `src/features/<name>/pages/`
3. Compose shared + page-specific primitives
4. Wire real Supabase data via typed-client helpers
5. Write/update Playwright specs (WF-#### rows — flip ❌ → ✅)
6. Flip DESIGN_CATALOG Adopted column for every primitive used

ProjectDetail runs in parallel with **W13 code split** (pure refactor — doesn't need a spec).

### STEP 5b · Hardening (me · 2 days · after all 5 pages migrated)

- 7-day soak per page
- Consolidate `<SendEmailDialog>` (4 duplicates → 1)
- Consolidate `<LineItemsEditor>` (3 duplicates → 1 parameterized)
- Archive legacy `src/pages/*DetailPage.tsx` files

### 12 consistency decisions to lock in STEP 2

Each gets ONE canonical answer in the STEP 2 design session, then every detail page conforms.

1. **Edit-mode trigger** — URL `/edit` (Project/Invoice/Company/Quotation) vs modals (Person) — pick one
2. **Save granularity** — one big save (Project's 750-LOC mutation) vs per-section save (Claim pattern) vs hybrid
3. **Save button location** — header vs sticky footer vs per-card
4. **Status transition UX** — single `<StatusTransitionModal>` vs scattered buttons (Quotation has 3-way split today)
5. **Destructive confirm pattern** — AlertDialog vs typed confirm vs math challenge (Project uniquely uses math)
6. **Audit log viewer** — accordion vs timeline vs dialog (4 bespoke impls today)
7. **Line-items editor contract** — notes-row · protectedIds · drag · auto-append (Invoice vs Quotation differ)
8. **Send email dialog** — template picker · recipients · PDF attach · date-update toggle
9. **Toast system** — finish `showEnhancedToast` → `showSuccess` migration (Project NAS still legacy)
10. **Cache invalidation** — every mutation lists keys explicitly (Person `toggleHitl` misses `people.all`; Company merge RPC misses all)
11. **Tab overflow on mobile** — horizontal scroll vs kebab vs accordion (Project has 10 tabs)
12. **Keyboard accessibility for drag** — line-items drag is mouse-only today (WCAG violation)

### Cross-page primitive map (what's shared vs unique)

| Primitive | Used by | Designed in |
|---|---|---|
| `<PageShell>` + `useEditModeSync` | All 5 | STEP 2 (shared) |
| `<TabNav>` (tabbed + stacked variants) | Project · Quotation (tabbed) · others (stacked) | STEP 2 (shared) |
| `<Timeline>` (scroll-beam) | Project · Quotation (full-page activity) | STEP 2 (shared) |
| `<ActivityLogTimeline>` (compact audit) | Project · Invoice · Company · Quotation | STEP 2 (shared) |
| `<StatusTransitionModal>` | Quotation · Invoice · Person · Company | STEP 2 (shared) |
| `<RelatedRecordsCard>` | Company · Project | STEP 2 (shared) |
| `<SendEmailDialog>` | Invoice · Quotation | STEP 2 (shared) |
| `<LineItemsEditor>` | Invoice · Quotation (· ProgressClaim S4b) | STEP 2 (shared) |
| `<DestructiveConfirmDialog>` | All 5 | STEP 2 (shared) |
| `<AgentPromptCard>` | Quotation only (7 pending cards) | STEP 4 · Quotation page chat |
| `<PersonRoleStatusPanel>` | Person only | STEP 4 · Person page chat |
| `<WhatsAppThreadPanel>` (extend existing `PersonWhatsAppPanel`) | Person · Quotation | STEP 4 |
| `<NASFolderMappingCard>` | Project · Quotation | STEP 4 |
| `<CompetitorPricingCard>` | Quotation only | STEP 4 · Quotation page chat |
| `<CDWPartsManager>` + `<SpatialFeatureSelector>` | Project · Quotation | Defer to S11 Spatial |

## Open workflow questions

- **Q-W08-a** Fonts — 🟡 **USER REVIEW PENDING**. Default was Geist Sans + Geist Mono + Instrument Serif. User override: **test Roboto, Geist Mono, Geist Pixel** in /design-lab before locking. Phase 1 2026-04-19 shipped the test page at `/design-lab/fonts`. User reviews side-by-side, picks a lock candidate via the "Lock this font" button (persists to localStorage `w08:font-pick:v1`), then tells Claude in Phase 2. Geist Pixel resolved as **self-hosted Square variant** — `geist-pixel-font` is not on npm yet, woff2 files live in `vercel/geist-pixel-font` GitHub repo; Square chosen as the most neutral of the five variants (Square · Grid · Circle · Triangle · Line). Stored at `public/fonts/geist-pixel/GeistPixel-Square.woff2`.
- **Q-W08-b** Motion philosophy — ✅ **RESERVED (2026-04-19)**. Only big moments animate: buttons, drawers, graphs, subtle shadows. Premium vibes. Rest of app is static. Colour constraint: majority white · **never solid black, use dark grey** (zinc-700/800 for near-black text + CTAs per v3.1 in LOCKED_PICKS.md). Phase 1 shipped motion tokens: `--motion-duration-instant` (80ms buttons) · `--motion-duration-quick` (180ms rows/hover) · `--motion-duration-smooth` (400ms page) · `--motion-ease-out-expo` · `--motion-ease-spring`. Signature-moment tokens (ticker spring, timeline beam, chart entrance) live in their own v1/v2 groups.
- **Q-W08-c** Dark mode with refactor or later? ✅ **WITH REFACTOR (2026-04-19)**. Accept default. Phase 1 shipped dark variants for every LOCKED_PICKS token + `ThemeProvider` scaffolding. Currently scoped to `/design-lab/fonts` toolbar — Phase 2 flips `document.documentElement` app-wide and audits the ~200 hardcoded `text-gray-*` sites.
- **Q-W08-d** Tailwind v3 or v4? ✅ **v4 (2026-04-19)**. Phase 1 shipped manual migration (codemod skipped — its utility-rename sweep was out of scope for Phase 1). `tailwind.config.ts` deleted; all config now lives in `src/index.css` via `@theme` + `@plugin` + `@custom-variant`. shadcn HSL token pattern preserved (400+ call sites keep working unchanged).

## Phase 1 delivery log — 2026-04-19

- `postcss.config.js` — plugin swap: `tailwindcss` → `@tailwindcss/postcss`
- `vite.config.ts` — added `@tailwindcss/vite` plugin alongside React SWC + lovable-tagger
- `src/index.css` — `@import "tailwindcss"` + `@plugin "tailwindcss-animate"` + `@plugin "@tailwindcss/typography"` + `@custom-variant dark (&:where(.dark, .dark *))` + `@theme { … }` with shadcn compat colors + radius + max-width + keyframes + Radix zinc/red 1–12 scales + LOCKED_PICKS v1/v2/v3 tokens + motion tokens + `.dark` overrides for every colour token
- `tailwind.config.ts` — **deleted** (v4 CSS-first)
- `src/lib/design/tokens.ts` — 11 named token groups (`cardTokens`, `dataTableTokens`, `kpiTileTokens`, `drawerTokens`, `stepperTokens`, `timelineTokens`, `chartTokens`, `ctaTokens`, `glassTokens`, `mobileTokens`, `motionTokens`) + aggregate `tokens` export
- `src/lib/design/ThemeProvider.tsx` — context + `useTheme()` + persisted preference
- `src/features/design-lab/fonts/FontTestPage.tsx` — 3-column Roboto · Geist Mono · Geist Pixel Square comparison · theme toggle (light/dark/system) · viewport toggle (desktop/375px) · "Lock this font" per column
- `src/App.tsx` — route `/design-lab/fonts` gated on same `/design-lab` module
- `src/features/design-lab/DesignLabPage.tsx` — "Font lab · Q-W08-a" header link
- `public/fonts/geist-pixel/GeistPixel-Square.woff2` — self-hosted from `vercel/geist-pixel-font` main branch
- `docs/01-system-architecture/DESIGN_SYSTEM.md` — deprecation banner pointing to LOCKED_PICKS + W08
- `docs/DOCUMENTATION_INDEX.md` — DESIGN_SYSTEM.md flipped 🟢 → 🔴 with redirect

## Done-when

**Phase 1** ✅ 2026-04-19:
- [x] Tailwind v4 infra in place
- [x] `src/lib/design/tokens.ts` with deep-import exports
- [x] `@theme` block with full LOCKED_PICKS token set + dark variants
- [x] `/design-lab/fonts` 3-way comparison page
- [x] ThemeProvider scaffolding (scoped to lab)
- [x] DESIGN_SYSTEM.md deprecated

**Phase 2** ✅ 2026-04-19:
- [x] User locks Q-W08-a font — Roboto (body) + Geist Mono (tabular/code) + Geist Pixel (opt-in pixel)
- [x] Selected font installed as body + display (heading) per LOCKED_PICKS direction
- [x] App-wide theme toggle wired in DashboardHeader (desktop + mobile)
- [x] 5,556 hardcoded sites audited → W08_PHASE_2_VIOLATIONS.md · ~500 files catalogued with per-primitive absorption forecast for W07 + per-module forecast for W09
- [x] 7 `src/components/ui/*` files retrofit to tokens
- [x] Shadcn `--primary`/`--destructive`/`--ring` remapped app-wide
- [x] `tsc` + `build` + Playwright 16/16 green

**Phase 3 🔵 PLANNED — Claude Design sessions (blocks W07 Phase 2 + W09):**
- [ ] Session 1 — List/Table archetype → refine `<DataTable>` + build `<AppHeader>` + `<Button variant=primary>` rebuild + `<FilterBar>` + migrate /quotations + /clientprofiles
- [ ] Session 2 — Dashboard → build `<KpiTile>` + `<Chart>` + migrate /dashboard + /engineer-dashboard
- [ ] Session 3 — Detail page → build `<Timeline>` + migrate /quotations/:id + /projects/:id
- [ ] Session 4 — Form / Create → build `<Stepper>` + `<MobileDrawer>` + migrate /quotations/create + /supervisor addworkentry
- [ ] Session 5 — Settings → migrate /quotationsettings + /xerosettings
- [ ] Session 6 — Tool / Calculator → migrate /ot-calculator + /performance-review
- [ ] User accepts the aesthetic ("yes this is the direction") after browsing proof modules in both light + dark

**Phase 4 — follow-ups (NOT blocking W09):**
- [ ] Motion primitives at `src/components/motion/`
- [ ] `/design-system` reference page
- [x] LOCKED_PICKS.md v3.1 amendment for primary CTA — **slate-700 `#334155`** (2026-04-19, 10.7:1 AAA, reverted from brief slate-500 trial)
