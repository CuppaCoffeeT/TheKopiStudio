# Lessons — src/components/primitives/form

Last Updated: 2026-08-19 SGT

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

## 2026-08-19 — The year dropdown could not reach a single birth year

**What happened**: opening the date-of-birth picker showed a year list running
2020–2028. There was no way to select 1986. Worse, the field read `28/01/01`,
which cannot be told apart from 1901.

**Root cause**: THREE things, each harmless alone. (1) `DatePicker` defaulted
`fromYear = 2020, toYear = 2030` — hardcoded, so every `DateField` in the app
inherited an eleven-year window, and the list would have gone stale on its own
in 2031. (2) `parseTypedDate` did `if (year < 100) year += 2000`, so a typed
`86` was always 2086 and never 1986. (3) `handleInputFocus` seeded the editable
buffer with the 2-digit year via `formatSlashed(value, short)` — so merely
focusing and blurring a 1986 date of birth round-tripped it to 2086 without the
advisor touching a key.

Symptom detail worth keeping: once the real year sits outside `[fromYear,
toYear]`, the native `<select value={year}>` has no matching `<option>`, so the
list opens on 2020 while the visible chip still prints the true year. That
mismatch is what made it look like the picker had "jumped to 2020".

**Fix**: bounds are now relative to the SG year (`−100 … +50`) and never
hardcoded; `parseTypedDate` takes the field's own `toYear` and pivots a 2-digit
year to 19xx when 20xx would overshoot it; the focus buffer always seeds the
4-digit year. `DateField` gained `variant="birth"`, which narrows the window to
the last 120 years, blocks future days and switches the display to `dd MMM
yyyy` so a date of birth is never ambiguous on screen. Locked by
`__tests__/datePickerHelpers.test.ts`.

**Supersedes** the "Not fixed here" note in
`src/features/crm/planning/lessons.md` (2026-07-28) — the century inference the
seedAge clamp was working around is now fixed at the source. The clamp stays:
it guards the column's history, not the picker.

**Lesson**: a default that encodes a literal year is a bug with a delivery
date. And a "display format" that also seeds the EDIT buffer is not a display
format — it is a parser input, and it will round-trip.
