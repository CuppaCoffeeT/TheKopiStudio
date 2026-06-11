# Mobile Web Standards

**Created**: 2026-05-27 17:00:00 SGT
**Last Updated**: 2026-05-27 19:30:00 SGT
**Status**: 🟢 Production
**Priority**: 🟢 High

## 📋 Overview

AppBase is a **dual-platform** portal — every module must work on both desktop and touch. The platform-first stance varies by feature/audience, not by the app as a whole:

| Feature / audience | Platform-first | Why |
|---|---|---|
| Supervisor (Add Work Entry, OT entry, daily attendance), Engineer dashboard, Drafter mobile flows, anything used in the field | **Touch-first** | Phone in pocket, gloves often, one-handed use, no desk |
| OT Calculator, JLTT page, Quotations, Invoices, Plan Purchases, Payment Management, anything with long data tables | **Desktop-first**, must remain **iPad-viewable** | Wide tables, multi-column filters, side-by-side panels, keyboard shortcuts |
| Dashboard, login, settings | **Both** — equally weighted | Cross-audience entry points |

The rules in this document apply whenever a feature renders on a touch device — they're the floor that keeps desktop-first features usable on iPad and touch-first features usable in the field. They are **not** a mandate to design every feature touch-first.

The most important rule, and the one that drove the previous "drawer fights with keyboard" failure mode: **complex forms on touch go in a fullscreen modal, not a bottom drawer**. iOS HIG and Material Design both prescribe this. Bottom drawers are for quick actions (filters, pickers, type chooser) — not multi-step forms.

## 📚 Related Documentation

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — tokens + primitive inventory
- [.claude/rules/mobile-web.md](../../.claude/rules/mobile-web.md) — auto-loaded enforcement rule
- [.claude/rules/ui-components.md](../../.claude/rules/ui-components.md) — Portal-in-Dialog gotchas

## 🎯 The Standards

### 1. Complex forms → fullscreen modal · Quick actions → bottom drawer

This is the most important rule. Picking the wrong container is the root cause of nearly every "mobile drawer broken with keyboard" report we've ever had.

| Use case | Container | Why |
|---|---|---|
| Multi-step wizard, long form, detail edit | **Radix Dialog with `fixed inset-0`** (fullscreen modal) — `WizardMobileDrawer` is the canonical adopter | iOS Safari's `position: fixed; bottom: 0` fights with the soft keyboard. A fullscreen modal sidesteps this entirely — the OS keyboard overlays the bottom, the focused input scrolls into view inside the modal's inner `overflow-y-auto` body, no JS keyboard handling required. |
| Quick action: filter sheet, photo-source picker, type chooser | vaul `<Drawer>` bottom sheet (the `Drawer` primitive) | Short, no typeable inputs, swipe-to-dismiss is the right affordance. |

**Anti-pattern** — putting a typing-heavy form in a bottom drawer. The cascade: input focus → iOS keyboard opens → `position: fixed; bottom: 0` element gets translated up by an indeterminate amount → drawer top off-screen → user can't see pull-tab → scrolling tries to dismiss the drawer instead of scrolling form. Every workaround for this (Visual Viewport API, `--app-vvh` CSS variable, vaul `repositionInputs`) is patching the symptom of using the wrong container.

### 2. Viewport units — `dvh` never `vh`

Inside a bottom drawer or any "fits visible area" container, use `dvh`. Never `vh`.

| Unit | Behaviour | Use for |
|---|---|---|
| `vh` | Locked to "large viewport" — never shrinks | Never |
| `svh` | "Small viewport" — assumes chrome visible | Above-the-fold content |
| `lvh` | "Large viewport" — chrome hidden | Hero / immersive |
| `dvh` | "Dynamic" — shrinks with browser chrome (URL bar) | **Default** |

Baseline support: Chrome 108+, Safari 15.4+, Firefox 101+ (June 2025).

**Note**: even `dvh` does NOT shrink for the iOS soft keyboard. The `interactive-widget=resizes-content` viewport meta makes Chrome/Firefox shrink for the keyboard, but iOS Safari ignores it ([WebKit standards-positions #65](https://github.com/WebKit/standards-positions/issues/65)). This is exactly why long forms go in a fullscreen modal (standard #1) — fullscreen modal doesn't care about keyboard-aware sizing.

Our `index.html` ships the meta tag for the browsers that respect it:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

### 3. Popovers / menus inside any overlay — cap height with Radix's available-height var

When a Radix Popover opens inside any Dialog or Drawer, cap the height with the var Radix provides. Otherwise the popover can flip above the trigger and crop above the viewport.

```tsx
// ✅ CORRECT — Radix's CSS var caps height; flex column keeps search input + footer pinned
<PopoverPrimitive.Content
  collisionPadding={8}
  className="max-h-[var(--radix-popover-content-available-height)] flex flex-col"
>
  <div className="flex-shrink-0">{/* search input */}</div>
  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{/* options */}</div>
  <div className="flex-shrink-0">{/* footer */}</div>
</PopoverPrimitive.Content>
```

Available-height vars per Radix component: `--radix-popover-content-available-height`, `--radix-dropdown-menu-content-available-height`, `--radix-select-content-available-height`.

### 4. Input focus — `font-size ≥ 16px` on touch devices

iOS Safari (iPhone + iPad) zooms any input with computed `font-size < 16px` on focus. Fix at the primitive layer:

```tsx
// In Input/Textarea/Select primitives
className="text-[14px] pointer-coarse:text-[16px]"
```

`pointer-coarse:` targets touch-primary devices (iPhone Safari, iPad Safari any orientation, Android Chrome). Desktop keeps the smaller size.

### 5. Touch target size — 44×44 px minimum on mobile surfaces

Apple HIG: 44×44 pt. Material: 48×48 dp. AppBase uses the 44 floor. Prefer `Button size="lg"` and `Input` with `h-11` on mobile-first screens.

### 6. Safe-area insets — respect notch + home indicator

```html
<meta name="viewport" content="... viewport-fit=cover ..." />
```

```tsx
// Bottom-pinned footer
style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}

// Top-pinned header
style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
```

### 7. Inner scrollers — `overscroll-contain`

```tsx
<div className="overflow-y-auto overscroll-contain">{/* list */}</div>
```

Stops scroll-chaining from inner list to the modal / page behind. Apply to every internal scroll container inside an overlay.

## ⚙️ Audit Checklist

Before merging a feature, classify it first:

- **Touch-first** (supervisor, engineer, field flows): run the full checklist below; primary surface = phone.
- **Desktop-first with iPad fallback** (OT calculator, JLTT, quotations, long-table modules): run the checklist for any surface that's reachable on touch (forms, filters, action sheets). The data table itself can be desktop-optimised but must not break at iPad widths.

Then verify on the relevant surface:

- [ ] Long forms are in a fullscreen Dialog, not a bottom drawer.
- [ ] No `vh` literal in any container — use `dvh`.
- [ ] Any picker/menu inside an overlay caps with `var(--radix-*-content-available-height)`.
- [ ] Typeable inputs render ≥ 16px on touch (via primitive — don't override at callsite).
- [ ] Primary actions on mobile-first screens use `size="lg"` (44px+ height).
- [ ] Bottom-pinned footers have `env(safe-area-inset-bottom)` padding.
- [ ] Test on real iPhone Safari (not just Chrome devtools).

## 🧠 Known iOS Safari Gotchas

| Symptom | Root cause | Fix |
|---|---|---|
| Input zooms when tapped | Computed `font-size < 16px` | Standard #4 |
| Drawer pushed off-screen when keyboard opens, gap below | Long form in a bottom drawer (wrong container) | Standard #1 — use fullscreen modal |
| Picker popover flips above trigger, search box cropped | No height cap on Popover Content | Standard #3 |
| Bottom CTA covered by home indicator | Missing `env(safe-area-inset-bottom)` | Standard #6 |
| Scrolling inside modal also scrolls page behind | Missing `overscroll-contain` | Standard #7 |
| Card hard to hit on phone | < 44px hit area | Standard #5 |

## 📜 References

- [Design for Native — Bottom Sheets vs Fullscreen Modals](https://designfornative.com/bottom-sheets-vs-fullscreen-modals/)
- [NN/G — Bottom Sheets: Definition and UX Guidelines](https://www.nngroup.com/articles/bottom-sheet/)
- [web.dev — The large, small, and dynamic viewport units](https://web.dev/blog/viewport-units)
- [Radix Primitives — Popover (collision-aware CSS vars)](https://www.radix-ui.com/primitives/docs/components/popover)
- [Defensive CSS — Input zoom on iOS Safari](https://defensivecss.dev/tip/input-zoom-safari/)
- [Apple HIG — Layout & touch targets](https://developer.apple.com/design/human-interface-guidelines/layout)
