# Design Philosophy — AppBase

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

## North star

**Calm shadcnblocks-clean + Linear / Vercel-style premium accents.** Data-dense screens for domain experts (engineers, supervisors, coordinators) — scannability and information hierarchy over minimalist restraint.

## The direction shift (2026-04-19)

Replaces the original **Tadao-Ando minimalism** rule (2025-Q4). Ando's "borders over shadows · near-monochrome" was a solo-dev pick; after three W17 design-lab rounds the team locked a different voice.

| Was (deprecated) | Is (locked 2026-04-19) |
|---|---|
| Near-monochrome, flat, borders over shadows | Glass headers · subtle shadows · purposeful micro-motion |
| Tadao-Ando concrete-modernism | shadcnblocks-clean + Linear / Vercel premium accents |
| Solid black or red primary CTAs | **Grey slate-800 CTA** (primary) · red-700 = destructive / focus only |
| System font stack | **Geist Pixel** headings · **Geist Mono** labels · **Roboto** body |
| Per-page pagination UI | Locked `DataTable` + `Pagination` primitives |

## 11 reuse principles (hard rules)

Canonical source: [DESIGN_REUSE_PRINCIPLES.md](../../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md). Summarized:

1. **Reuse first** — grep `primitives/CONTEXT.md` + `DESIGN_CATALOG.md` before building
2. **Place in primitive folders** — `shell / overlays / dashboard / detail / form / ui / charts`
3. **Legacy stays put** — don't fork; wrap via slot pattern until W09 migration
4. **Slot pattern for legacy** — pass as `<prop>Slot`, not callback
5. **No forking** — copy = tech debt
6. **Check `DESIGN_CATALOG.md` first** — design ≠ impl ≠ adopted
7. **Font rule** — Roboto body · Geist Mono labels · Geist Pixel h1 ≤48px · Grid ≥140px
8. **Page composition** — `AppHeader → ImpersonationBanner → PageShell/DetailPageFrame` (no one-off chrome)
9. **Brand assets in `/public/images/`** — no inline SVG duplication
10. **No speculative machinery** — only build what's in the current design spec
11. **Feedback on every interactive** — 5 states (default · hover · active · focus-visible · disabled). Hover must visually differ from page-bg. Focus-visible = red-700 ring 3px offset. Disabled = 40% opacity. Loading states required.

## Why this design exists

The portal is internal to Your Company — construction operations, 50–200 concurrent users, data-heavy, often used on-site on phones. The design must:

- **Survive mobile on a worksite** — glass headers, stacked-card rows, floating CTAs
- **Scale to 70+ pages** without per-page font / color / spacing debate — locked tokens, locked component picks
- **Signal status at a glance** — 6-tone status palette (draft/sent/accepted/rejected/expired/revised)
- **Feel calm during 8-hour shifts** — muted zinc surfaces, red restricted to critical moments

## 📚 Related

- [TYPOGRAPHY.md](./TYPOGRAPHY.md) · [COLORS.md](./COLORS.md) · [SPACING_MOTION.md](./SPACING_MOTION.md)
- [DESIGN_REUSE_PRINCIPLES.md](../../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — principles source-of-truth
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — W17 component locks
- [_archive/DESIGN_SYSTEM.md](../_archive/DESIGN_SYSTEM.md) — previous (deprecated) Tadao-Ando direction
