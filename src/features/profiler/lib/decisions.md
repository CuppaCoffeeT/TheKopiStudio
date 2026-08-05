# Profiler — Decisions

## 2026-06-11 — Lazy routes (base convention over stale SOP line)

All profiler routes in `App.tsx` use `React.lazy()` + Suspense, per the base's
own convention (App.tsx header comment: "Lazy-load them with React.lazy() so
each page becomes its own chunk"). MODULE_CREATION_SOP's "direct import" line
is stale and was deliberately not followed (verified in the PRD research,
PROFILER_MODULE_PRD.md § Wiring). The public `/profiler` route sits OUTSIDE
the DashboardLayout group (sibling of `/login`, no ProtectedRoute — sanctioned
public route) so it carries its OWN `<Suspense>` boundary with the same
fallback DashboardLayout uses; the protected routes reuse DashboardLayout's
single Suspense boundary.

## 2026-06-11 — One feature folder per DOMAIN, not per module row

`src/features/profiler/` hosts BOTH the wizard (`/profiler`) and the saved
results surfaces (`/profiler-results`, `/profiler-results/:id`). Module rows
drive tiles + access control; folders follow the domain: wizard and results
share content (QS/NVG/PR), the scoring engine, export builders and the
`results`-table types — splitting them would force cross-feature imports of
`lib/` internals through barrels. Account Settings and Manage Accounts are
separate domains and get their own feature folders.

## 2026-06-11 — Wizard composed from Progress + Cards, NOT WizardShell

The `WizardShell` primitive is a Modal composition (overlay + `max-h-[60vh]`
scrollable body + step-chip header) built for short 3–4 step desktop form
wizards. The profiler flow is a PUBLIC, full-page, touch-first 7-step flow
ending in a long scrolling report — putting it inside a modal fights mobile
ergonomics, print layout and the legacy UX. Per the PRD escape hatch, the
wizard composes `Progress` (sticky "Step n of 7" header), `Card`-based
screens and a fixed bottom Back/Next bar (44px targets, safe-area inset)
instead. `WizardFooter`/`WizardStepperHeader` were not reused either: both
assume the Modal action-row idiom (`ModalGhostAction`/`ModalPrimaryAction`).

## 2026-06-11 — Wizard draft persistence + duplicate-save guard (NEW vs legacy)

PRD-sanctioned additions to the otherwise faithful port: (1) screens 1–7
persist `{screen, intake, answers, nv, notes}` to sessionStorage key
`profiler-wizard-draft` — restored on refresh, cleared on generate and on
explicit exit (exit = Back from screen 1, confirmed when mid-flow; legacy
`go(0)` semantics of keeping intake fields are preserved). (2) Auto-save on
generation is guarded by an input signature (intake + answers + TRUE-ticked
ids, sorted; notes EXCLUDED — legacy saved once at generation, later note
edits were export-only). Regenerating with unchanged inputs skips the insert
and keeps the saved state; "Profile Another Prospect" resets the guard.

## 2026-06-11 — Question-set freeze (versioning required for any copy edit)

`QS` question/option order and `NVG` item ids are part of the PERSISTED data
contract, not just UI copy: every saved row's `raw_answers` stores the option
index (`oi`) per question and `nv_observations` is keyed by NvItem id. Detail
reconstruction and the golden-master replay resolve those indexes/ids against
the CURRENT content arrays — reordering options, inserting questions, or
renaming observation ids would silently re-interpret historical rows. Any
future copy edit therefore needs an explicit versioning decision (e.g. a
content-version column or an id-stable migration) BEFORE it ships. Pure
wording fixes that keep array positions and ids intact are safe.

## 2026-06-11 — Report bars hand-rolled, NOT the Progress primitive

The wizard's step header DOES use the `Progress` primitive (neutral tone fits
there). The report's DISC score bars (`ScoreCard`) and MBTI strength bars
(`MbtiCard`) are hand-rolled `role="progressbar"` divs instead: `Progress`
locks its fill tones to neutral/active/success/error (slate/red/green by
design — "Locked" in its header), while the report bars ARE the legacy DISC
colour identity (`PR[d].col` per letter, amber for MBTI) with relative-to-max
widths and "{pts} pts" labels. Re-skinning the primitive would break its
locked design contract; the hand-rolled bars keep full a11y semantics
(aria-valuenow/min/max + labels).

## 2026-06-11 — Anonymous saves preserved (explicit product decision)

The wizard stays public and anonymous results keep saving with `user_id`
NULL — live legacy behaviour preserved by explicit user decision (PRD
"Resolved decisions"). Mechanics follow the untouched legacy RLS: anon can
INSERT (`WITH CHECK true` + anon grants) but has NO SELECT path, so the anon
save is fire-and-forget (`.insert()` without `.select()`; representation
would 403). The new app never sends a spoofable `user_id` when logged out;
tightening the policy itself is cutover work. Consequence: anonymous rows are
visible only to managers and are read-only until the cutover backfill claims
them.

## 2026-06-11 — DISC/MBTI tie-breaks encoded explicitly

Legacy `calcPf` relied on object insertion order + stable sort for DISC
ranking; the port encodes the resulting tie order EXPLICITLY — D > I > S > C
for both primary and secondary (`DISC_TIE_ORDER` in `lib/scoring.ts`), and
MBTI dimension winners use `>=` so ties collapse toward E/S/T/J. Locked by
the golden-master suite and the tie-break corpus in
`lib/__tests__/scoring.test.ts`; do not "fix" to alphabetical or random.

## 2026-06-12 — P4: convert-to-client is own-rows-only and non-atomic with a keyed retry

Convert lives in the isOwn action group only (desktop hero + mobile bar):
the legacy `results` UPDATE policy is `auth.uid() = user_id`, so only the
owner can write `client_id` — managers and anonymous viewers get no
affordance, and RLS enforces it server-side regardless. The flow is two
statements with no transaction (no RPC this PRD, sanctioned for v1):
INSERT `clients` → UPDATE `results.client_id`. A failed step 2 leaves an
orphan client BY DESIGN; `convertService` throws `ConvertLinkError` carrying
the created client id, `useConvertResult` keeps that id in hook state (held
at page level so it survives modal close/reopen), and the next attempt calls
`relinkResultToClient` with the kept id instead of inserting again — no
duplicate client. The error copy explains the orphan and that retrying will
not duplicate. `convertService` writes `public.clients` from the profiler
feature on purpose: the merge plan sanctions an own-feature api hitting
shared tables, while importing crm's clientsService would be a cross-feature
drift error. Provenance is a notes prefix
(`Converted from profiler result <id8> · Age range … · DISC … · MBTI …`)
because converted clients have no date_of_birth — age_range is a band; the
client report defaults age math to 40 until the advisor fills DOB.

## 2026-06-12 — P4: linked-result visibility resolves to ONE neutral empty state (crm-side card)

The prospect→client link is intentionally asymmetric: profiler owns the WRITE
(convertService) and the result-side affordances (Convert / View client);
the READ surface — the "Communication style" card — is crm-owned
(`crm/api/linkedResultsService`, letters + playbook link only; no profiler
imports). Because the untouched legacy results RLS prunes rows server-side,
a client whose linked results are invisible to the viewer (advisor's client
linked to an anon-owned result; super_admin until cutover) is
INDISTINGUISHABLE from a never-converted client — the card therefore renders
the single neutral caption 'No visible profiling results' for both, and the
profiler feature deliberately exposes NO API to disambiguate (doing so would
leak row existence past RLS). Full rationale + palette decision:
`src/features/crm/lib/decisions.md` (2026-06-12 P4 entry).

## 2026-07-25 — print.css repointed to Kopi Studio; paper is a SEPARATE contract from app chrome

`print.css` was moved off the navy/gold values (gold `#C9A84C` rule + kicker,
`#111` ink, Arial) onto Kopi Studio. Three defaults locked here so they are
not re-litigated:

1. **Paper stays white.** The cream page background `#F0E6D6` is deliberately
   NOT carried into print — a printed report is its own artifact, not a
   screenshot of the app surface. `body{background:#fff!important}` stays.
2. **Literal hexes, never `var(--…)`.** Even though `src/index.css` now
   defines every Kopi token, the print sheet hardcodes. A future app re-theme
   (or a returning dark mode) must not be able to leak into the printed
   output. Same deliberate decoupling as `crm/lib/report-print.css`.
3. **Raw brand brown is a MARK, not type.** `#8B6A47` carries the `.rph` rule;
   the sub-18px `.rph-kicker` takes the AA-safe `#806241` (`--brown-text`),
   because the raw brown is 4.00:1 on cream and fails AA as small text.

Type follows the same >=18px serif floor as the app: `.rph-name` (22px) is
Instrument Serif at weight **400** — the face ships 400 only (index.html loads
`Instrument+Serif:ital@0;1`), so the legacy `font-weight:bold` would have been
browser-synthesised faux-bold. Everything smaller is IBM Plex Sans. Both
stacks keep a generic serif/sans-serif fallback because a print job can render
before the Google Fonts link resolves. Scoping selectors, the `.print-area`
visibility pattern and `@page` were left untouched — colour and type only.

The extended report-only palette (grey `#E8E6E0`, green box `#D9E8E0`) is
permitted on paper but is NOT declared here: nothing in this sheet paints a
box, and adding unused classes would be dead CSS.

## 2026-07-25 — Screen report repointed to Kopi 2a: DISC hue is a TINT, semantics are sage/terracotta

Second pass over the profiler's SCREEN components (print.css was already
done — see the entry above). Four defaults locked so they are not
re-litigated:

1. **DISC identity is always a tint over cream, never a slab.** `ResultHero`
   was a `linear-gradient(135deg, col+EE, col+88)` band with white type — the
   only dark surface left in the feature. It is now a flat `col+24` tint on
   the card, with type on the ink ladder (`--fg` / `--fg-dim`). This makes the
   hero match what `DiscChip`, `DiscBadge`, `TraitsCard`, `OpeningLineCard`,
   `QuestionScreen` and `ObservationScreen` already did, and makes contrast
   independent of which of the four DISC hexes won. The DISC hexes themselves
   (`#C0392B` `#D4680A` `#1A7A40` `#1A5F8A`) are FROZEN legacy content data,
   not app chrome — they are never repointed at the brand palette.
2. **Do/Avoid and Watch-For are the report's semantic pair, so they take sage
   and terracotta** — not the retired `green-*` / `red-*` Tailwind scales.
   Fills use the brand tints (`--delta-positive-bg` / `--delta-negative-bg`,
   `bg-destructive/10`), borders the 0.28 alphas
   (`--status-accepted-border` / `--status-rejected-border`). Every string in
   these blocks is under 18px, so text resolves to `--sage-text` /
   `--negative-text` and NEVER to raw `#5A7A5E` or `#D97551`.
3. **`text-accent` is banned under 18px in this feature.** `--accent` is the
   raw brown `#8B6A47`, which measures 4.00 on page and 4.58 on card — legal
   only as a fill. Every sub-18px brown string (eyebrows, phase tags, playbook
   category heads, MBTI winners, the occupation chip) now uses
   `--brown-text`. `bg-accent/*` and `border-accent/*` are untouched: raw
   brown stays correct as a fill and a border.
4. **No categorical hues survive.** `QuestionScreen`'s Discovery tag was
   `bg-sky-950/60 text-sky-400`; 2a admits no third hue, so the two phases now
   separate on the brown/neutral axis (Opening = brown tint, Discovery =
   `bg-secondary` + `--fg-dim`) rather than brown vs blue.

Progress-bar tracks (`ScoreCard`, `MbtiCard`) moved to `--border-faint`. The
old tracks (`bg-secondary`, `bg-background/60`) were dark-era recesses that on
the cream ground land within a hair of the tile fill and stop reading as an
unfilled remainder.

The `font-mono` numerals (`{pts} pts`, playbook ordinals) were deliberately
LEFT ALONE: 2a's "everything else is IBM Plex Sans" is a display-type rule,
and `index.css` keeps the mono stack as a sanctioned exception for tabular
numerals. They are numerals, not display type.

## 2026-07-25 — Accent washes are borders, not fills; DISC hex freeze upheld

Third adversarial pass over the 2a repoint. Four refinements, all colour-only:

1. **`bg-accent/*` on a `Card` is banned; the accent lives in the border.**
   `IntakeForm`, `PlaybookSection`, `FollowUpCard` and the `ResultActions`
   login CTA each passed `bg-accent/5`–`/10` to `Card`. `cn` is twMerge, so
   that REPLACED `bg-card` — the tint then composited over the PAGE cream, not
   over card cream. Two failures at once: the card rendered DARKER than the
   page (the raised-card ladder inverted), and the muted copy inside fell to
   3.68–4.06:1. All four are now `border-accent/*` only, on `bg-card`, where
   the same copy reads 4.72:1. A brown wash over the page ground is not a
   legal card surface in 2a.
2. **`Eyebrow` defaults to `--fg-dim`, not `--fg-muted`** (the swap StatusTabs
   and TabNav already made). At 10.5px `--fg-muted` only clears 4.5:1 on a flat
   cream ground, and the eyebrow is used on grounds that are not flat: the
   wizard page cream (4.12:1) and `OpeningLineCard`'s DISC tint (3.73–3.83:1).
   `--fg-dim` clears every one — 6.40 page, 7.34 card, 5.78–5.95 on the four
   DISC tints. This supersedes the "Eyebrow keeps its muted token" note that
   was inline in `ResultSections`.
3. **New token `--brown-text-on-wash` `#6D5233`** for small brown type on a
   brown wash of its own hue (`ScoreCard`'s occupation chip, `QuestionScreen`'s
   Opening phase tag, both `bg-accent/15`). Entry 3 of the 2026-07-25 decision
   above locked `--brown-text` for every sub-18px brown string; that value is
   calibrated for the two flat cream grounds (4.54 / 5.21) and drops to 4.33:1
   on brown@15%-over-card. Refines — does not reverse — that entry:
   `--brown-text` still governs the flat grounds. The wash stayed at 15%
   deliberately: dropping it to 8% would have fixed contrast too, but 8% over
   card cream is indistinguishable from Discovery's `--secondary` tint and
   would have collapsed the brown/neutral phase axis locked in entry 4.
4. **DISC hex freeze re-affirmed.** The pass proposed repointing
   `#C0392B`/`#D4680A`/`#1A7A40`/`#1A5F8A` onto `--chart-ramp-1..4` or the
   `--status-*` families as brand drift. Declined — entry 1 of the 2026-07-25
   decision above froze these as legacy CONTENT data, and the ramp is a
   sequential brown scale, so using it for a 4-way categorical encoding would
   have taken the selected-row `borderColor` to `#DCCBB6` (~1.1:1 on cream) and
   destroyed the selection affordance. The two a11y defects the proposal was
   rooted in were fixed at the text layer instead (items 2 above and 5 below).
5. **`QuestionScreen`'s selected option flips to `text-foreground`**, mirroring
   `ObservationScreen`. The DISC tint that marks the chosen row dropped
   `--fg-muted` to 4.21–4.33:1, so the one row that must read best was the only
   one failing; on the tint the ink token reads 10.9–11.2:1.

## 2026-07-25 — No emoji in the profiler flow; DISC hues stay as a scoped exception

Two rulings, both recorded in full at
[docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md](../../../../docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md).

1. **No emoji anywhere in `/profiler`, result screens included.** `ResultHero`'s
   `{p.em}`, `PlaybookSection`'s `catIcons`, `ScoreCard`'s occupation glyph and
   `ResultSections`' Watch-For glyph are gone, replaced by an Instrument Serif
   DISC monogram, a zero-padded index numeral and plain labels. `PR[].em` and
   `NVG[].em` stay in `lib/content/` under the parity contract — do not delete
   the data, and do not render it. Monochrome `✓` / `✕` marks are not emoji and
   stay.
2. **The DISC hues stay** — they encode the quadrant, which is this tool's whole
   output. They are FILLS only: the letter and the profile name carry the
   meaning, and text over a tint always takes `--fg` or `--fg-dim`. Measured on
   the hero band's 14% fill over page cream, `--fg` is 8.72–9.20:1 and
   `--fg-dim` 5.24–5.53:1; `--fg-muted` is 3.37–3.56:1 there and is banned. As
   text the raw hexes are 4.40 / 2.94 / 4.36 / 5.58 — DISC-I fails — which is
   why no small type is ever coloured with them. Extends entry 4 of the
   2026-07-25 decision above; this is the fourth time the repoint has been
   declined.

## 2026-08-05 — Wizard hero + rhythm matched to the app-wide spacing/type retune
**Decision**: The intake masthead takes the app's fluid hero step — `PageTitle` at `clamp(36px, 3vw + 22px, 44px)` / lh 1.05 / tracking −0.02em (same clamp family as the login wordmark) — replacing the fixed `text-[30px] sm:text-[34px]`; the wizard main goes `py-6 sm:py-10` (+ `pb-12` out of flow), the intake stack `gap-5 → gap-6`, header `pb-5 → pb-6`, description `mt-1.5 → mt-3`. The 42rem reading column, sticky top bar / progress strip and `pb-28` in-flow clearance are deliberate wizard ergonomics and stay.
**Why**: The 2026-08-05 app-wide retune (see the 2a handoff decisions.md) moved every other surface to the ×1.25 hero ladder and 40/48px page rhythm; the wizard was the last screen on the old 34px/20px values and read as a different product.
**Impact**: `ProfilerWizardPage.tsx`, `IntakeForm.tsx`. Results list/detail pages needed nothing — they ride `ListPageFrame`/`DetailPageFrame` and inherited the retune.

## 2026-08-05 — Signed-in advisors get the rail on /profiler; the route stays public
**Decision**: `ProfilerWizardPage` renders `AppSidebar` + `SIDEBAR_OFFSET_CLASS` (with `print:pl-0!`) itself when a session exists (`c.user`), and hides `WizardTopBar` at ≥ lg in that case so the wordmark/Dashboard chrome is never doubled; the fixed Back/Next bar takes `lg:left-[200px]` when the rail is on screen. Anonymous visitors keep the exact rail-free public flow, and the route stays outside `DashboardLayout`/`ProtectedRoute` — this is chrome, not access control; the anonymous-save contract above is untouched.
**Why**: User request (2026-08-05): advisors kept "losing" the app when opening the wizard — the rail makes it read as part of the shell. Partially supersedes the chrome consequence of "Lazy routes" above ("never gets AppSidebar") and the identity note in `WizardTopBar`'s header, both updated in step.
**Impact**: `ProfilerWizardPage.tsx`, `WizardTopBar.tsx` (comment). Below lg nothing changes for anyone (the rail doesn't exist there; the bar remains). Print keeps its full-bleed canvas via `print:pl-0!` + the bar's existing `print-hide`.
