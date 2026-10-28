# Canonical Form Page Pattern

**Created**: 2026-05-30 SGT
**Last Updated**: 2026-10-28 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

The **single canonical pattern** for any FORM / CREATE / EDIT surface in AppBase (one of 6 page archetypes). Whether a record is created in a modal, a drawer, or a full page, the field stack is the same: **stateless form primitives** (`Field` + `Input` + `SelectMenu` + `DatePicker`) composed inside a frame (`Modal` for dialogs).

> **2026-10-28**: the `Drawer` frame, form `Select` / `Label` / `RadioGroup` / `Stepper`, and every `@/components/ui/*` file except `sheet.tsx` (incl. `ui/form`, `ui/dialog`, `ui/calendar`, `ui/staff-select`) were deleted as unused. Rows below point at the survivors; re-create a deleted one only when a real form needs it. See [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md).

**Read this first** if your task is: "build a create dialog", "add an edit form", or "migrate a Dialog form to primitives".

Router-style doc — links to real adopters + primitives. Does not duplicate code.

## The Canonical Stack

| Layer | Use | Never |
|-------|-----|-------|
| Modal frame | `Modal` + `ModalPrimaryAction` + `ModalGhostAction` (`@/components/primitives/overlays`) | `@/components/ui/dialog` + hand-rolled footer |
| Field wrapper (label + error + hint) | `Field` (`@/components/primitives/form`) | raw `<label>` + `<p class="text-red">` trio |
| Text / number | `Input` (`@/components/primitives/form`) | native `<input>`, `@/components/ui/input` |
| Multi-line | `Textarea` | native `<textarea>` |
| Select | `SelectMenu` · `SearchableMultiSelect` (`@/components/primitives/overlays`) | native `<select>` |
| Date | `DatePicker` (`@/components/primitives/form`) | `@/components/ui/calendar` inline · raw date input |
| Checkbox / Radio / Switch | `Checkbox` · `Radio` · `Switch` (`@/components/primitives/form`) | native inputs |

Field primitives are **stateless** — the caller owns state (react-hook-form or `useState`) and wires `value`/`onChange`. The frame (`Modal`) owns open/close + the action footer.

## Shape

```tsx
<Modal open={open} onOpenChange={setOpen} title="New project">
  <form onSubmit={handleSubmit}>
    <Field label="File number"><Input value={…} onChange={…} /></Field>
    <Field label="Client"><SearchableMultiSelect … /></Field>
    <Field label="Start date"><DatePicker value={…} onChange={…} /></Field>
    <ModalGhostAction onClick={() => setOpen(false)}>Cancel</ModalGhostAction>
    <ModalPrimaryAction type="submit" loading={isSubmitting}>Create</ModalPrimaryAction>
  </form>
</Modal>
```

The field body is identical whatever the frame.

## Adopter references

| Adopter | File | Frame |
|---------|------|-------|
| Client create / edit | `src/features/crm/components/modals/ClientFormModal.tsx` | `Modal` + `Field` stack |
| Policy create / edit | `src/features/crm/components/modals/PolicyFormModal.tsx` | `Modal` + `Field` stack |

Start from **ClientFormModal.tsx**. (The AppBase-era adopters — `NewProjectDialog`, `shared/project-create`, claims/invoice create — were never in this repo.)

## Rules

- Field primitives never carry their own data fetch. A picker over a table takes its options from the caller and composes `SearchableMultiSelect`.
- Submit is one mutation; on success `showSuccess` + invalidate the parent list/detail query key + close the frame.
- Validation lives in a zod schema beside the form (or in the feature `lib/`); surface errors through `Field`'s error slot.
- A field group reused by 2+ forms is promoted to `src/components/shared/<domain>/` (e.g. `project-create/`), not duplicated.
- Keep a form component under 200 LOC. Split a long form into field-group child components.

## Anti-patterns

- ❌ `@/components/ui/dialog` + a manual Cancel/Save button row → `Modal` + `ModalPrimaryAction`/`ModalGhostAction` own the footer.
- ❌ Native `<input>` / `<select>` / `<label>` → primitive `Input` / `SelectMenu` / `Field` (trips W09 grep 6c/6d).
- ❌ Long multi-step form inside a bottom sheet → fullscreen `Modal` (mobile-web rule #1).
- ❌ An inline calendar inside a Popover for a single date → `DatePicker`.

## 📚 Related Documentation

- [CANONICAL_DETAIL_PAGE_PATTERN.md](./CANONICAL_DETAIL_PAGE_PATTERN.md) — DETAIL archetype
- [SEARCHABLE_SELECT_COMPONENT.md](../SEARCHABLE_SELECT_COMPONENT.md) — combobox primitive
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — full primitive inventory
- [.claude/rules/ui-components.md](../../../.claude/rules/ui-components.md) — DatePicker / SearchableMultiSelect / Portal rules
- [.claude/rules/mobile-web.md](../../../.claude/rules/mobile-web.md) — modal-vs-drawer container rule
- [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md)
