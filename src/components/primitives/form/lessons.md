# Lessons — src/components/primitives/form

Last Updated: 2026-05-29

## 2026-05-29 — DatePicker in a modal: inline clips, body-portal can't be clicked — fix is collision-aware inline

**What happened**: in the /quotations Create-Quotation modal the "Valid Until" calendar (rightmost column) overflowed the modal's right edge and was clipped. A first attempt — portaling the panel to `document.body` on desktop to escape the clip — made it visible but UNCLICKABLE (day cells didn't respond).

**Root cause (two competing constraints, both real)**:
1. **Clip** — `DialogContent` has `overflow-y-auto`; CSS forces `overflow-x` to `auto` too, so a panel hard-coded to `left-0` that extends past the trigger gets clipped. The real defect was the panel ignoring whether it fits — it never flipped sides like a normal popover.
2. **Can't-click** — a panel portaled to `document.body` lives OUTSIDE the Radix modal's `DialogContent`. Radix locks `pointer-events:none` on `<body>` while a modal is open and only re-enables it on `DialogContent`, so the portaled day cells inherit `pointer-events:none`. (Same family as the documented iOS `react-remove-scroll` tap-blocking.) Radix `DialogContent`'s `translate(-50%,-50%)` transform also means a `position:fixed` child can't be portaled *inside* the dialog without being clipped — hence the body portal in the first place.

So: inline = clickable but clips; body-portal = escapes clip but unclickable. Neither pure mode works in a modal.

**Fix**: stay INLINE inside a Dialog (clickable), and make the inline panel collision-aware — open `right-0` instead of `left-0` when a left-anchored 296px panel would spill past the Dialog's right edge (measured once on open via `getBoundingClientRect`). Outside a Dialog, keep portaling (no body lock there). ~6 lines, no `pointer-events` juggling, no dismiss-layer fighting, no device sniffing.

**How to apply**: a popover that must live inside a Radix *modal* Dialog should stay inline and be positioned to fit — do NOT portal it to `document.body` to dodge clipping, because the modal's `pointer-events:none` body lock will make it unresponsive. Body-portal positioning is only safe for popovers OUTSIDE a modal (cards, scrolling tables). `TimePicker.tsx` shares the inline/portal split — if it ever clips inside a modal, apply the same collision-aware inline alignment, not a body portal.

## 2026-05-29 — Checkbox/Switch inside a clickable row → double-fire + keyboard gap (cross-domain)
**Origin**: src/features/quotations (MultiSelectFieldOption) — same class found+fixed in features/projects (CategoryMultiSelect, NCEServiceListItem, NCEServicePickerNoNCEOption) + features/payslip (AddWorkersModal).
**What happened**: a row `<div onClick={toggle}>` wrapping the primitive `Checkbox` (native `<label><input>`). Clicking the checkbox area made the `<label>` forward a 2nd synthetic click to the `<input>` that ALSO bubbled to the row → `toggle` fired twice → net no-op ("checkbox won't select, intermittent"). If the row instead wired `onCheckedChange={toggle}` AND the row had `onClick={toggle}`, same double-fire.
**Fix pattern (use one, never both)**: EITHER (a) checkbox is presentational — `labelClassName="pointer-events-none"` + `readOnly tabIndex={-1} aria-hidden`, and the ROW owns the toggle AND the a11y contract: `role="checkbox"` + `aria-checked` + `tabIndex={0}` + Enter/Space `onKeyDown` + focus ring; OR (b) the checkbox owns the toggle (`onCheckedChange`) and the row is NOT clickable. Never have both the row onClick and a live checkbox handler.
**Separately**: "checkbox doesn't save" on auto-save cards (project detail) was a DIFFERENT root cause — `useAutoSaveForm` dropping programmatic `setValue` events (see src/hooks/lessons.md 2026-05-28). Two distinct bugs with the same symptom; check which applies.
**Candidate systemic fix**: consider a primitive `<ToggleRow>` (or a documented row-checkbox composition) so callers stop re-deriving this and tripping the double-fire each time.
