# Universal Components — Protocols & Exceptions (detail)

_Last Updated: 2026-05-30 SGT_

Loaded on demand from [universal-components.md](./universal-components.md). Holds the three protocols (create, edit, JSDoc) + the sanctioned-exceptions table + common-violations record. Parent rule auto-loads on every edit; this file is read only when you're building or editing a primitive.

## Sanctioned `ui/**` exceptions (kept in sync with W09 greps)

Primitives supersede these; they remain because the alternative would regress more than it fixes.

| `ui/**` still used | Why | Next step |
|---|---|---|
| `ui/form` — `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` | react-hook-form adapter; wraps primitive inputs via `FormControl` cloneElement. Primitive `Input`/`Textarea` render bare when no slots are used, so they plug into `FormControl` cleanly. | Keep `ui/form` as-is. Fill its slots with primitive inputs in new code. |
| `ui/calendar` | Date-grid used inline inside Popover compositions. Primitive `DatePicker` bundles this. | Swap callsites to primitive `DatePicker` when touching the file. |
| `ui/command` — `Command`/`CommandInput`/`CommandList`/`CommandItem` | Used inside Popover for rich autocomplete. Primitive `CommandPalette` is a full ⌘K launcher, not a dropdown. | Follow the `QuotationLineItemsEditor` `ProductPicker` pattern — primitive `Popover` + custom rendered list. |
| `ui/date-picker`, `ui/searchable-select` | Thin pre-primitive wrappers. Primitive `DatePicker` / `SearchableMultiSelect` supersede. | Per-callsite swap when touching the file. |
| `ui/staff-select`, `ui/company-select` | Domain-specific selects. **Internal: primitive `SearchableMultiSelect` since 2026-04-27** (`SMSOption.disabledMessage` + `triggerTestId` props added). Path retained for callsite stability. | Keep in `ui/`. Already internally primitive-composed. |
| `ui/unit-select` | Domain-specific category-grouped select. Primitive `SMSOption` doesn't support `group` field yet. | Keep in `ui/` until `SMSOption.group?: string` enhancement ships. Bespoke retained 2026-04-27. |
| `ui/client-contact-multi-select` | Domain wrapper around primitive `StarredMultiSelect` (which itself composes `SearchableMultiSelect`). Owns supabase client-contact query + Primary-PIC role lookup + inline `ContactForm` add-new dialog. **Internal: primitive since 2026-05-25** (W09 `/projects/create` close — promoted `StarredMultiSelect` to add the "star one as primary" affordance). Used by `NewProjectDialog`, `AcceptQuotationDialog`, `ProjectDetailPage`. | Keep in `ui/`. Already internally primitive-composed. |
| `ui/table` (`Table`/`TableRow`/`TableCell`/...) | Low-level shadcn primitives. Primitive `DataTable` composition supersedes for list archetypes. | Per-callsite migration when touching the file. |
| `ui/project-select` | Domain-specific project picker — peer to `ui/staff-select` / `ui/company-select` / `ui/unit-select`. Pairs a project query hook with primitive `SearchableMultiSelect`. **Relocated 2026-05-26** from `@/components/projects/ProjectSelect` into `@/components/ui/project-select.tsx` so it lives alongside the other domain pickers and stops tripping grep 6b in adopting feature folders. | Keep in `ui/`. Already internally primitive-composed. |
| `ui/cdw-parts` (`CDWPartCard`/`CDWPartEditDialog`/`CDWPartsCardGrid`/`CDWPartsSummary`) | Domain-shared CDW (Cable Detection Work) parts UI — used by `features/quotations/CDWPartsManager` + `components/project-management/ProjectCDWPartsDisplay`. **Relocated 2026-05-26** from `@/components/cdw-parts/` into `@/components/ui/cdw-parts/` so consumers stop tripping grep 6b. | Keep in `ui/`. Future: promote to primitives via design spec when CDW parts get a dedicated design pass. |
| `ui/contact-form` (+ `ui/duplicate-contact-dialog`) | Client-contact CRUD form — used by 6 adopters across clientprofiles, companies, quotations, engineer-dashboard. **Relocated 2026-05-26** from `@/components/client-management/contacts/` so adopters stop tripping grep 6b. Promotion to primitive form deferred to W08 form design session. | Keep in `ui/` until W08 form session ships a primitive equivalent. |
| `ui/adhoc-contact-dialog` | Custom-email "add adhoc" sub-modal — sub-modal of the shared `EmailRecipientPicker` (in `@/components/shared/email/`). Pure-presentation: validates an `{email, contact_name, recipient_type}` payload and returns it. Kept in `ui/` because the picker mounts it as a sibling overlay; promoting to a primitive needs the W08 form session. **2026-05-28**: `ui/email-recipient-selection-dialog` deleted in Phase E of /quotations W09 closeout — primitive `RecipientPickerDialog` + shared `EmailRecipientPicker` composition replaced the 757-LOC monolith. | Keep in `ui/` until W08 form session ships a primitive equivalent. |
| `ui/product-service-form` (folder — `ProductServiceForm` · `productServiceFormSchema` · `useCodeUniqueness` · `useMaterialCatalog` · `form/*`) | Cross-feature product/service CRUD form — used by `features/products-services` page (full CRUD) + `features/quotations/QuotationLineItemsEditor` (inline quick-add) + `features/materialinventory` (Add/Edit material). **Relocated 2026-05-26** from `@/components/products-services/`. **`mode` prop (2026-05-31)**: `full` (sales+purchase, admin direct-write) vs `material` (purchase-only, code auto-gen, + Stock & Suppliers section, writes via `save_material` RPC). Sections are flat (`form/FormSection`, no inner `Card`). | Keep in `ui/`. Future: promote to primitive form when W08 form session ships a primitive equivalent. |
| `ui/quotation-ref-data-modals` (folder — `JobTypeFormModal` · `ClientWorkTypeFormModal` · `AreaTypeFormModal`) | Inline-create ref-data dialogs shared by `features/quotation-settings` (full CRUD page) + `features/quotations/UnifiedQuotationView` (inline-create from quotation wizard). **Relocated 2026-05-26** from `features/quotation-settings/components/` to fix the `features/quotations → features/quotation-settings` cross-feature import detected by dependency-cruiser. | Keep in `ui/`. Future: promote to primitive `RefDataFormModal` once a generic pattern emerges. |
| `ui/company-email-modal` | Create/edit a `client_company_emails` row — shared by `features/companies` CompanyDetail (side-rail email admin) + the shared `EmailRecipientPicker` (`@/components/shared/email/`, via `EmailRecipientPickerSubModals`) for the inline ad-hoc add-from-picker flow. **Relocated 2026-05-27** from `@/components/client-management/company/CompanyEmailModal.tsx`. Already 100% primitive-composed (Modal · Field · Input · Textarea). | Keep in `ui/`. Future: promote to a primitive overlay alongside RecipientPickerDialog if a shared "domain-modal" pattern emerges. |
| `ui/nce` (folder — `NCEPartCard` · `NCETable`/`NCETableRow` · cells/* · modals/* · hooks/* · `NCETabHeader` · `useNCETabFilters` · `useNCEAutoSyncClaimable`) | Shared editable NCE submission editor (table + cells + part toggles + Add/Delete + claimable) — used by `features/projects` detail NCE tab **and** `features/ncedashboard` inline-expanded panel. **Relocated 2026-05-29** from `features/projects/components/detail/nce/` so the dashboard could offer full inline-edit parity without a cross-feature import (dep-cruiser `no-cross-feature-imports`). Consumers import the barrel `@/components/ui/nce` only. | Keep in `ui/`. Future: promote inner atoms (date cell, status/app-type selects) to primitives via a dedicated NCE design pass. |
| `ui/claimable-items-inbox` (folder — `ClaimableItemsInbox`) | Shared claimability-triage surface — ONE component for BOTH the payment-management global inbox (`scope="global"`) and the project-detail Claims tab (`scope={{ projectId }}`); used by `features/payment-management` `ClaimsInvoicingTab` + `ProjectDetailView`. **Sanctioned 2026-06-01** (primitive-coverage gate PRD) because it is an explicit **pre-design scaffold** (`TODO(design)`, raw HTML internals) pending the Claude Design handoff — migrating it now would be discarded when the design lands. NOT yet internally primitive-composed (unlike the rows above) — sanctioned as *deferred-to-design*, not *primitive-composed*. | Keep in `ui/` until the Payment design handoff promotes it to a primitive. **Absorbing work**: `docs/.../PAYMENT_SYSTEM_REVAMP_DESIGN_PROMPTS.md` Prompt 2. Remove this row when that ships. |

**Adding a new sanctioned entry** requires a **3-file** sync commit (the `SANCTIONED` string is now triplicated — keep all three byte-identical):
1. Append row above.
2. Update the `SANCTIONED` string in [docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md](../../docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md) Gate 3 (the canonical per-feature grep whitelist).
3. Update the `SANCTIONED` string in [scripts/check-repo.sh](../../scripts/check-repo.sh) §7 (the repo-wide enforcement gate — `npm run check:repo`).

Out-of-sync whitelists = primary drift failure mode for the primitives-only compliance gate.

## The 5-step edit protocol (when changing a primitive)

A primitive change ripples to every adopter. Before you edit:

1. **Re-read the Claude Design spec** — each primitive's JSDoc header points to the `design/session-*/export/appbase/project/*.jsx` source-of-truth. Read it top-to-bottom.
2. **Check adoption in `DESIGN_CATALOG_PRIMITIVES.md`** — if `Adopted: 1/80 (+79 pending W09)` the prop API must stay backward-compatible.
3. **Add props, don't rename or remove** — TypeScript won't catch a `leadingIcon`→`startIcon` rename across 80 adopters. If you *must* break, grep consumers + migrate in the same commit.
4. **Visual verify per [design-system.md](./design-system.md)** — open spec HTML + `npm run dev` side-by-side, exercise all 5 states (default / hover / active / focus-visible / disabled).
5. **Update the catalog** — flip `Impl 🟡/🟢`, update row description if behavior changed, update CONTEXT.md inventory if the import path changed.

## Create-a-new-primitive protocol

Before writing code:

1. **Re-grep `primitives/` + `components/**`** — a half-built version probably exists.
2. **Require a Claude Design spec** — no spec, no build. Prompt a new session; export bundle; THEN implement.
3. **Place**: `shell/` · `overlays/` · `dashboard/` · `detail/` · `form/` · `ui/` · `charts/` · root atom. Barrel-export from the group's `index.ts`.
4. **Consume v4 tokens** (not raw hex) — fonts: `--font-sans`/`--font-mono`/`--font-pixel`/`--font-pixel-display` · CTA slate-800 · focus red-700 · hover must contrast with `--page-bg` (zinc-100).
5. **Implement ALL 5 states** — default / hover / active / focus-visible / disabled.
6. **Register in 3 places** — `primitives/CONTEXT.md` inventory · `DESIGN_CATALOG_PRIMITIVES.md` inventory + `DESIGN_CATALOG_MATRIX.md` matrix column · group's `index.ts`.
7. **Bonus — add a row** to [universal-components.md](./universal-components.md) "Need → Import" matrix so the Need to Import matrix routes to the new primitive.
8. **JSDoc header** points back to the spec file so future agents can find source-of-truth in one grep.

## Top-of-file JSDoc pattern

```tsx
/**
 * <PrimitiveName> — one-sentence purpose.
 *
 * Spec: docs/99-refactor/_system/design/session-XX-topic/export/appbase/project/<File>.jsx
 * Adopters: tracked in DESIGN_CATALOG_PRIMITIVES.md `Adopted` column.
 *
 * Locked: <any primitive-specific locks>.
 */
```

## Known Patterns

### Leniency of W09 closing-checklist let /quotation ship with 57 shadcn imports (2026-04-21)

**Pattern**: a W09 migration claimed complete while `src/features/quotation/` still imported `ui/select` (×8), `ui/dialog` (×6), `ui/alert-dialog` (×6), `ui/separator` (×4), `ui/label` (×4), `ui/form` (×4), `ui/input`/`ui/textarea` (×6), `ui/tabs` (×2), `ui/alert` (×2), `ui/radio-group` (×2), `ui/collapsible` (×2), plus specialized ui/**. Net: 57 legacy imports across 22 files, plus raw `<button>`/`<label>` that the grep missed entirely.

**Root cause (three leniencies)**:
1. Compliance #6 grep only checked `@/components/ui/` — missed `@/components/*` (non-primitive) and raw HTML.
2. "Legacy-keep" was treated as an end state instead of a named, user-approved deferral.
3. No grep for raw `<button>` / `<input>` / `<select>` / `<textarea>` / `<label>` / `<h1>` — primitives exist for every one but agents fell back to native HTML when primitive API translation felt hard.

**Fix (applied 2026-04-21)**:
- Compliance #6 expanded to five hard greps (6a shadcn-minus-sanctioned, 6b non-primitive components, 6c raw interactive HTML, 6d raw labels, 6e raw h1). See [docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md](../../docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md) Gate 3.
- Closing-checklist now has one checkbox per grep — cannot mark complete while any returns non-zero.
- "Legacy-keep" requires user's explicit named approval in-conversation + NOTES.md entry with W-card absorbing it.
- Missing primitives (Separator, Tabs, Label) either promoted via /design-prompt OR explicitly deferred.

### "AppHeader slot filler" 6b sanction allowed 9 features to ship with data-coupled `@/components/*` imports (2026-05-15)

**Pattern**: starting with `features/payslip/lib/NOTES.md` 2026-04-22, W09 closures documented `@/components/admin/ImpersonationSelector` + `@/components/shell/NotificationsBellPopover` as "AppHeader slot fillers — sanctioned, design-intent, not deferral". The precedent propagated to `features/dailyattendance`, `features/payment-management`, `features/coordinatorreview`, `features/comms`, `features/dashboard`, `features/emailaccount`, `features/xero-settings`, `features/pdf-templates` — 9 feature folders shipped with grep 6b returning 2 (sometimes 3 with SEOBlock). Each NOTES.md reaffirmed the prior precedent with phrasing like "same precedent as payslip" or "stays a slot ingredient permanently".

**Root cause**:
1. Both legacy components were data-coupled: they internally called `useAuth` / `useDashboardCounts` / `useQuery` / `supabase.rpc`. The "AppHeader takes a slot" abstraction conflated two distinct things — the slot API (correct) and the data-coupling of the slot filler (the problem).
2. The closing-checklist allowed cross-feature "shell-helper carve-out" reasoning instead of requiring per-feature, in-conversation user approval (the standard set by the quotation 2026-04-21 fix).
3. The retraction path was repeatedly described as a future W-card ("absorbed by future auth-impersonation W-card", "stays permanently", "out of scope") with no scheduled execution.

**Fix (applied 2026-05-15)**:
- Promoted two new pure-presentation primitives: `NotificationsBell` + `ViewAsSelector` (both in `src/components/primitives/shell/`). Same pattern as `EmailComposeForm` — stateless, caller passes data.
- Added two connector hooks: `useViewAs` + `useNotificationsBell` (in `src/hooks/`). They own all `supabase` / `useAuth` / `useQuery` wiring.
- Call site is now `<NotificationsBell {...useNotificationsBell()} />` + `<ViewAsSelector {...useViewAs()} />` — feature pages import exclusively from `@/components/primitives/*` + `@/hooks/*`.
- `AppHeaderShell` + `DetailPageFrame` + `DashboardHeader` + `useDashboardChrome` defaults internalised the same swap so adopters that pass no slot still get working chrome.
- Legacy `@/components/admin/ImpersonationSelector.tsx` + `@/components/shell/NotificationsBellPopover.tsx` deleted. Empty `@/components/shell/` directory removed.
- Sanction wording struck from all 9 NOTES.md files; grep 6b now returns literal zero across every migrated feature.

**Lesson**: a "slot is intentional" pattern at the AppHeader API does NOT excuse data-coupling in the slot filler. If a `@/components/*` non-primitive import survives 6b, ask whether the visual layer is reusable AND the data layer is decouple-able — if both, the fix is "promote primitive + extract hook", not "name it a slot ingredient and move on". Cross-feature sanctions that defer to "a future W-card" with no schedule are the failure mode.

## Related

- [universal-components.md](./universal-components.md) — parent rule (Need → Import matrix, auto-loaded)
- [design-system.md](./design-system.md) — visual-verify protocol (auto-loaded)
- [docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md](../../docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md) — Gate 3: the greps that enforce these protocols
- [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) — 144-primitive inventory
- [docs/99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md](../../docs/99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md) — Design · Impl · Adopted (per-primitive)
- [docs/99-refactor/_system/DESIGN_CATALOG_MATRIX.md](../../docs/99-refactor/_system/DESIGN_CATALOG_MATRIX.md) — Module × primitive matrix
- [docs/99-refactor/_system/DESIGN_CATALOG.md](../../docs/99-refactor/_system/DESIGN_CATALOG.md) — Catalog router
