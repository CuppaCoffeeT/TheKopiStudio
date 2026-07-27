# Canonical Form Page Pattern

**Created**: 2026-05-30 SGT
**Last Updated**: 2026-05-30 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

The **single canonical pattern** for any FORM / CREATE / EDIT surface in AppBase (one of 6 page archetypes). Whether a record is created in a modal, a drawer, or a full page, the field stack is the same: **stateless form primitives** (`Field` + `Input` + `Select` + `DatePicker`) composed inside a frame (`Modal` for dialogs, `Drawer` for bottom sheets).

**Read this first** if your task is: "build a create dialog", "add an edit form", or "migrate a Dialog form to primitives".

Router-style doc — links to real adopters + primitives. Does not duplicate code.

## The Canonical Stack

| Layer | Use | Never |
|-------|-----|-------|
| Modal frame | `Modal` + `ModalPrimaryAction` + `ModalGhostAction` (`@/components/primitives/overlays`) | `@/components/ui/dialog` + hand-rolled footer |
| Bottom-sheet frame (quick actions) | `DrawerRoot` … `DrawerFooter` (`@/components/primitives/overlays`) | bespoke vaul wrapper. Long forms → fullscreen Modal, not Drawer (mobile rule) |
| Field wrapper (label + error + hint) | `Field` (`@/components/primitives/form`) | raw `<label>` + `<p class="text-red">` trio |
| Text / number | `Input` (`@/components/primitives/form`) | native `<input>`, `@/components/ui/input` |
| Multi-line | `Textarea` | native `<textarea>` |
| Select | `Select` (`@/components/primitives/form`) · `SearchableMultiSelect` (`@/components/primitives/overlays`) | native `<select>` |
| Date | `DatePicker` (`@/components/primitives/form`) | `@/components/ui/calendar` inline · raw date input |
| Checkbox / Radio / Switch | `Checkbox` · `Radio`/`RadioGroup` · `Switch` (`@/components/primitives/form`) | `@/components/ui/*` raw |
| Multi-step indicator | `Stepper` (`@/components/primitives/form`) | manual step counter |
| RHF adapter (sanctioned) | `ui/form` `Form`/`FormField`/`FormControl`/`FormMessage` — fill its slots with primitive inputs | native HTML inside `FormControl` |

Field primitives are **stateless** — the caller owns state (react-hook-form or `useState`) and wires `value`/`onChange`. The frame (`Modal`/`Drawer`) owns open/close + the action footer.

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

Swap `Modal` → `DrawerRoot`/`DrawerContent` for a quick-action bottom sheet. The field body is identical across frames.

## Adopter references

| Adopter | File | Frame |
|---------|------|-------|
| New project | `src/features/projects/components/NewProjectDialog.tsx` | `Modal` + `Input`/`Label` + `Button` (composes shared `project-create` field groups) |
| Project create field groups (shared) | `src/components/shared/project-create/NewProjectIdentificationFields.tsx` · `ProjectClientContactsFields.tsx` | reusable `Field` stacks |
| Claims create / edit | `src/features/claims/pages/ClaimsCreate.tsx` · `ClaimsEdit.tsx` | `AppHeaderShell` full-page form |
| Invoice create | `src/features/invoices/pages/InvoiceCreate.tsx` | full-page form |

Start from **NewProjectDialog.tsx** — the canonical `Modal` + primitive-field dialog, with field groups extracted to `src/components/shared/project-create/`.

## Rules

- Field primitives never carry their own data fetch. A `Select` of staff/companies imports the sanctioned domain wrapper (`ui/staff-select`, `ui/company-select`) which internally composes `SearchableMultiSelect`.
- Submit is one mutation; on success `showSuccess` + invalidate the parent list/detail query key + close the frame.
- Validation lives in a zod schema beside the form (or in the feature `lib/`); surface errors through `Field`'s error slot.
- A field group reused by 2+ forms is promoted to `src/components/shared/<domain>/` (e.g. `project-create/`), not duplicated.
- Keep a form component under 200 LOC. Split a long form into field-group child components.

## Anti-patterns

- ❌ `@/components/ui/dialog` + a manual Cancel/Save button row → `Modal` + `ModalPrimaryAction`/`ModalGhostAction` own the footer.
- ❌ Native `<input>` / `<select>` / `<label>` → primitive `Input` / `Select` / `Field` (trips W09 grep 6c/6d).
- ❌ Long multi-step form inside a bottom `Drawer` → fullscreen `Modal` (mobile-web rule #1).
- ❌ `@/components/ui/calendar` inline inside a Popover for a single date → `DatePicker`.

## 📚 Related Documentation

- [CANONICAL_DETAIL_PAGE_PATTERN.md](./CANONICAL_DETAIL_PAGE_PATTERN.md) — DETAIL archetype
- [SEARCHABLE_SELECT_COMPONENT.md](../SEARCHABLE_SELECT_COMPONENT.md) — combobox primitive
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — full primitive inventory
- [.claude/rules/ui-components.md](../../../.claude/rules/ui-components.md) — sanctioned `ui/**` form wrappers
- [.claude/rules/mobile-web.md](../../../.claude/rules/mobile-web.md) — modal-vs-drawer container rule
- [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md)
