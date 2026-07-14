# Design Philosophy — Insurance CRM

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-14 SGT
**Status**: 🟢 Production

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

## North star

**Editorial navy/gold/serif — a permanently-dark, warm, magazine-like aesthetic.** Deep navy canvas, cream text, gold accents, Georgia serif display type. The app reads like a well-set financial publication: calm, authoritative, premium. Built for insurance advisors reviewing client profiles and portfolios — trust and legibility over dashboard flash.

## The direction shift (2026-07-14)

Supersedes the **AppBase slate/zinc/Geist** direction (locked 2026-04-19, itself superseding 2025-Q4 Tadao-Ando minimalism). The user's 2026-07-14 reversal (Insurance CRM redesign PRD) made the original Prospect Profiler navy/gold aesthetic the system of record — recorded in [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) ("Editorial navy/gold/serif" entry).

| Was (AppBase, deprecated 2026-07-14) | Is (locked 2026-07-14) |
|---|---|
| Light-first zinc surfaces + class-toggled dark mode | **Always dark** — navy `#0D1B2A` canvas; `:root` == `.dark`; theme toggle is a no-op |
| Slate-800 primary CTA · red-700 accent/focus | **Gold `#C9A84C`** CTA + accent + focus ring · red only for destructive |
| Geist Pixel headings · Geist Mono labels · Roboto body | **Georgia serif** display/prose · system-ui sans body/UI |
| Page zinc-100, card white (cards recessed darker in dark mode) | Card `#12202F` **raised lighter** than the navy page |

**What survives from AppBase**: the primitive library, the archetype system, the locked token NAMES (LOCKED_PICKS v1–v4 var names are frozen — only their values were retuned to navy/gold), the reuse principles below.

## 11 reuse principles (hard rules)

Canonical source: [DESIGN_REUSE_PRINCIPLES.md](../../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md). Summarized:

1. **Reuse first** — grep `primitives/CONTEXT.md` + `DESIGN_CATALOG.md` before building
2. **Place in primitive folders** — `shell / overlays / dashboard / detail / form / ui / charts`
3. **Legacy stays put** — don't fork; wrap via slot pattern
4. **Slot pattern for legacy** — pass as `<prop>Slot`, not callback
5. **No forking** — copy = tech debt
6. **Check `DESIGN_CATALOG.md` first** — design ≠ impl ≠ adopted
7. **Font rule** — system sans for body/UI · Georgia serif for display headings + prose (see [TYPOGRAPHY.md](./TYPOGRAPHY.md))
8. **Page composition** — `AppHeader → PageShell/DetailPageFrame` (no one-off chrome)
9. **Brand assets in `/public/images/`** — no inline SVG duplication
10. **No speculative machinery** — only build what's in the current design spec
11. **Feedback on every interactive** — 5 states (default · hover · active · focus-visible · disabled). Hover must visually differ from the navy page bg. Focus-visible = gold ring 3px offset. Disabled = 40% opacity. Loading states required.

## Why this design exists

Insurance CRM is an advisor-facing tool — client profiling, portfolio review, follow-ups. The design must:

- **Feel trustworthy and editorial** — serif display type + warm navy/gold signals "financial publication", not "admin panel"
- **Stay coherent at any hour** — one permanent dark theme; no light/dark drift, no toggle-state bugs
- **Scale without per-page debate** — locked tokens + locked primitives inherited from AppBase
- **Signal status at a glance** — 6-tone status palette retuned as translucent tints on navy

## 📚 Related

- [TYPOGRAPHY.md](./TYPOGRAPHY.md) · [COLORS.md](./COLORS.md) · [TOKENS.md](./TOKENS.md) · [SPACING_MOTION.md](./SPACING_MOTION.md)
- [DESIGN_REUSE_PRINCIPLES.md](../../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — principles source-of-truth
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — component locks + the 2026-07-14 aesthetic-reversal entry
- [DARK_MODE.md](./DARK_MODE.md) — always-dark contract
