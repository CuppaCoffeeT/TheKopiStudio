# src/hooks — Lessons

Last Updated: 2026-05-28

## 2026-05-28 — `useAutoSaveForm` filter on `type === 'change'` swallows all select/date-picker saves

**What happened**: After the 2026-05-27 auto-save standardisation, every Details-tab card select (billing_company_id, company_id, engineer_id, status, claim_type, award_date, contract_end_date, the four project_categories selects) silently stopped saving. User-visible symptom: change the value, click ✓, value snaps back to the original — but the underlying DB never changed, so the next refetch shows the old value too.

**Root cause**: `useAutoSaveForm` filtered watch events with `if (type !== 'change' || !name) return;`. RHF (`react-hook-form@7.53`) only emits `type: 'change'` for events that originate from a `register()`-bound input's native `onChange`. Programmatic `form.setValue(name, v, { shouldDirty: true })` — which is what every primitive `Select` / `DatePicker` / `CompanySelect` / `StaffSelect` uses in this codebase — emits `{ name, values }` with `type: undefined`. The filter dropped every one of those events, so `save.mutate` never fired.

**Fix**: relax the guard to `if (!name || type === 'blur') return;`. Accept both real `change` events and `undefined`-typed `setValue` events; reject `blur` so registered text inputs don't double-fire (they already save via `handleBlur`). Regression-tested in `useAutoSaveForm.test.ts`.

**How to verify in RHF directly**: `renderHook(() => useForm()); result.current.watch((_, info) => console.log(info)); result.current.setValue('x', 'y', { shouldDirty: true });` — info logs `{ name: 'x', type: undefined }`, never `'change'`.

**Don't reintroduce**: any future `useAutoSaveForm` change MUST keep the test `'fires save when a saveOnChange field is updated via setValue'` passing. If you find yourself wanting to filter by `type` again, that's the warning sign — filter by the allowlist (`onChangeFieldsRef.current.includes(name)`) and the dedup (`serialize(values) !== lastSavedRef.current`) instead, which is what already prevents stray events from looping.

## 2026-05-29 — `useAutoSaveForm` blur-save dropped the FIRST blur (stale `formState.isDirty`)
**What happened**: On project-detail cards, editing a TEXT field (project_number, file_number) and exiting did NOT save the first time — the value reverted; only a second edit+exit in the same card saved. (project_name/description "worked" only because they're edited *after* the first field, so the proxy was already subscribed — it was positional, not a Textarea-vs-Input difference.)
**Root cause**: `handleBlur` gated on `if (!form.formState.isDirty) return;`. `formState.isDirty` was read ONLY inside that callback, never during render, so RHF's `formState` proxy never subscribed it — the FIRST access returns a stale `false` (and the act of reading it subscribes it, so later blurs read the live value). First blur bailed → no save.
**Fix**: removed the `formState.isDirty` gate entirely. The line below it — `serialize(form.getValues()) !== lastSavedRef.current` — is the real, deterministic guard: it reads live values (no proxy subscription) and already no-ops an unchanged blur. Regression test added: `useAutoSaveForm.test.ts` → "saves on the FIRST blur of a text field edited via its registered input".
**Rule**: never gate logic on `form.formState.<flag>` read only inside an event handler — RHF formState flags are reactive-proxy values that must be read during render to be reliable. Use `getValues()` + your own diff, or `getFieldState`, in callbacks. (Sibling to the 2026-05-28 `type==='change'` bug in this same hook — both were over-eager guards swallowing saves.)
