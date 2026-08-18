---
paths:
  - 'src/**/*.tsx'
  - 'src/**/*.ts'
  - 'src/index.css'
  - 'index.html'
---

# Rule: Mobile Web Standards (MANDATORY)

## Summary

AppBase is **dual-platform** — both desktop and touch must work. Platform-first varies by feature: **touch-first** for supervisor / engineer / field flows (Add Work Entry, OT entry, daily attendance, drafter mobile); **desktop-first with iPad-viewable fallback** for data-heavy modules (OT calculator, JLTT, quotations, invoices, plan purchases, long tables). These rules apply whenever a surface renders on touch — they're the floor that keeps touch usable, not a mandate to design every feature touch-first.

The single most important rule: **long multi-step forms on touch go in a fullscreen modal (Radix Dialog `fixed inset-0`), never a bottom drawer**. iOS HIG + Material Design both prescribe this — bottom drawers fight with the iOS soft keyboard and every workaround (Visual Viewport API, `dvh` hacks, vaul translate flags) patches symptoms of using the wrong container. Drawers are for quick actions (filters, pickers, type chooser). Other recurring rules below: `dvh` not `vh`, cap Popover height with `--radix-*-content-available-height`, `16px` input font-size on touch (`pointer-coarse:`), `44px` touch targets, safe-area-inset for notch + home indicator.

## Detailed Patterns

### 1. Container choice — fullscreen modal vs bottom drawer

```tsx
// ✅ CORRECT — long form on mobile → fullscreen Dialog (Radix)
// `WizardMobileDrawer` is the canonical adopter (legacy name; internally Dialog)
<DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col bg-white">
  <header className="flex-shrink-0">…</header>
  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{form}</div>
  <footer className="flex-shrink-0">…</footer>
</DialogPrimitive.Content>

// ✅ CORRECT — short quick action → vaul Drawer (bottom sheet)
<DrawerRoot><DrawerContent>{quickPickerOrFilter}</DrawerContent></DrawerRoot>

// ❌ FORBIDDEN — long form in a bottom drawer
<DrawerRoot><DrawerContent>{longMultiStepWizard}</DrawerContent></DrawerRoot>
```

If the surface has more than one typeable input or is more than one screen tall, it's a form → fullscreen modal. No exceptions.

### 2. Layout heights — `dvh` to SIZE an overlay, `svh` to floor a PAGE, never `vh`

Two different jobs, and using one for the other is the iPad scroll bug:

| Job | Unit | Why |
|---|---|---|
| Cap an overlay to the visible area (drawer, sheet, modal) | `dvh` | It should track the chrome — a sheet must stay reachable as the URL bar moves. |
| Floor a full-page shell so a short page still fills | `svh` | It is the SMALL viewport, measured with the browser chrome showing, and is the only one that does not change while you scroll. |
| Anything | ~~`vh`~~ | The LARGE viewport: always taller than what you can see, so it invents phantom scroll. |

**Why a page must not use `dvh` (2026-08-18).** `dvh` resizes as the iOS/iPadOS
toolbar collapses and expands. On a page shell that is a height change DURING a
scroll gesture: reach the bottom, the toolbar animates, the container shrinks,
and the last rows shift or slide out of view. Reported as "scrolling to the
bottom makes bottom content move/disappear" and fixed by moving every page
shell to `min-h-svh`. `html, body { min-height: 100% }` in `src/index.css`
paints the ground under the shortfall — do NOT put `dvh` back to close it.

```tsx
// ✅ CORRECT — drawer for quick action, dvh for visible-area sizing
<DrawerContent className="max-h-[90dvh]">…</DrawerContent>

// ✅ CORRECT — page shell floor, stable across the toolbar animation
<div className="min-h-svh bg-background">…</div>

// ❌ FORBIDDEN — vh literal in any container/sheet/modal
<div className="max-h-[90vh]">…</div>

// ❌ FORBIDDEN — dvh/vh as a PAGE min-height (the iPad bottom-jump bug)
<div className="min-h-dvh">…</div>
<div className="min-h-screen">…</div>

// ❌ FORBIDDEN — manual VV-API gymnastics. If you find yourself reaching for this, the container is wrong; switch to fullscreen modal (rule #1).
useVisualViewportHeight();
style={{ maxHeight: 'min(90dvh, var(--app-vvh, 100dvh))' }}
```

### 3. Popover/menu inside any overlay — cap to available height

```tsx
// ✅ CORRECT — Radix's CSS var caps the height; flex column lets inner list scroll
<PopoverPrimitive.Content
  collisionPadding={8}
  className="max-h-[var(--radix-popover-content-available-height)] flex flex-col"
>
  <div className="flex-shrink-0">{/* search input */}</div>
  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{/* options */}</div>
  <div className="flex-shrink-0">{/* footer */}</div>
</PopoverPrimitive.Content>
```

Available-height vars: `--radix-popover-content-available-height`, `--radix-dropdown-menu-content-available-height`, `--radix-select-content-available-height`.

### 4. Input font-size on touch — `pointer-coarse:text-[16px]`

```tsx
// ✅ CORRECT — desktop compact, touch lifts to 16px (kills iOS focus-zoom)
className="text-[14px] pointer-coarse:text-[16px]"

// ❌ FORBIDDEN — viewport meta hack (a11y violation)
<meta name="viewport" content="... maximum-scale=1, user-scalable=no" />
```

### 5. Touch targets — 44×44px floor on mobile surfaces

Use `Button size="lg"` (h-12) and `Input` with `h-11` override on screens primarily used on phones.

### 6. Viewport meta — single canonical line

```html
<!-- index.html — ✅ canonical -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

`viewport-fit=cover` unlocks `env(safe-area-inset-*)`. `interactive-widget=resizes-content` helps Chrome/Firefox shrink `dvh` for the keyboard (iOS Safari ignores it — see rule #1).

### 7. Inner scrollers — `overscroll-contain`

```tsx
<div className="overflow-y-auto overscroll-contain">{/* list */}</div>
```

## Key Behaviours

- **Pick the right container first.** If a surface needs typing, default to fullscreen modal.
- **Fix at the primitive layer.** Per-page overrides should be rare — if more than one feature needs the same mobile fix, it belongs in the primitive.
- **Test on real iPhone Safari.** Playwright's mobile-safari emulation is close but doesn't reproduce the full iOS keyboard / VV behaviour.

## Anti-patterns (will be caught in review)

- ❌ Long form rendered inside a vaul `<DrawerContent>` (use fullscreen Dialog instead — rule #1)
- ❌ `max-h-[90vh]` / `h-[80vh]` / any `vh` literal
- ❌ `min-h-screen` / `min-h-dvh` on a page shell — use `min-h-svh` (rule #2)
- ❌ Radix Popover/Menu Content without `max-h-[var(--radix-*-content-available-height)]` when reachable on mobile
- ❌ Typeable input primitive without `pointer-coarse:text-[16px]`
- ❌ `<meta viewport … maximum-scale=1>` — a11y violation
- ❌ Bottom-pinned bar without `env(safe-area-inset-bottom)` padding on mobile screens
      (the PAGE's own bottom inset is handled once on `body` in `src/index.css`)
- ❌ Visual Viewport API + `--app-vvh` workarounds — symptom of wrong container choice

## References

- [docs/01-system-architecture/MOBILE_WEB_STANDARDS.md](../../docs/01-system-architecture/MOBILE_WEB_STANDARDS.md) — full spec + audit checklist
- [.claude/rules/ui-components.md](./ui-components.md) — Portal-in-Dialog gotchas
- [src/components/primitives/overlays/wizard/WizardMobileDrawer.tsx](../../src/components/primitives/overlays/wizard/WizardMobileDrawer.tsx) — canonical fullscreen-modal adopter
- [src/components/primitives/overlays/Drawer.tsx](../../src/components/primitives/overlays/Drawer.tsx) — bottom drawer (quick actions only)
