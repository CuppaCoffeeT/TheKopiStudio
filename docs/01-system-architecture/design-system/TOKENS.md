# Tokens — Full Reference

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

**Runtime source of truth**: [src/index.css](../../../src/index.css) `@theme` block + [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts). Table below mirrors for reference; always consume from CSS vars in components.

## 11 token groups

Each group maps to one locked primitive. Edit the primitive → edit its token group only.

| Group | TS export | Primary consumer | Section below |
|---|---|---|---|
| Card | `cardTokens` | `Card` | #card |
| DataTable | `dataTableTokens` | `DataTable` / `DataRow` | #datatable |
| KpiTile | `kpiTileTokens` | `KpiTile` + `NumberTicker` | #kpitile |
| Drawer | `drawerTokens` | `DrawerRoot` (vaul) | #drawer |
| Stepper | `stepperTokens` | `Stepper` | #stepper |
| Timeline | `timelineTokens` | `Timeline` (scroll-beam) | #timeline |
| Chart | `chartTokens` | `AreaChart` / `BarChart` / `HBarChart` | #chart |
| CTA | `ctaTokens` | `Button variant="primary/destructive"` | #cta |
| Glass | `glassTokens` | `AppHeader` sticky | #glass |
| Mobile | `mobileTokens` | `MobileListCard` · `FloatingCTA` | #mobile |
| Motion | `motionTokens` | all animated primitives | #motion |

## Card { #card }

| Token | Value |
|---|---|
| `--card-radius` | 1rem (16px) |
| `--card-border` | #e4e4e7 zinc-200 |
| `--card-shadow-rest` | `0 1px 2px rgba(0,0,0,0.04)` |
| `--card-shadow-hover` | `0 4px 12px rgba(0,0,0,0.08)` |
| `--card-padding` | 1.25rem (20px) |

## DataTable { #datatable }

| Token | Value |
|---|---|
| `--row-hover-bg` | #f4f4f5 zinc-50 |
| `--row-enter-duration-ms` | 180 |
| `--sort-icon-opacity-rest` | 0.4 |

## KpiTile { #kpitile }

| Token | Value |
|---|---|
| `--kpi-radius` | 1rem |
| `--delta-positive-bg` / `--delta-positive-fg` | #dcfce7 / #15803d |
| `--delta-negative-bg` / `--delta-negative-fg` | #fee2e2 / #b91c1c |
| `--ticker-spring-stiffness` | 100 |
| `--ticker-spring-damping` | 60 |

## Drawer { #drawer }

| Token | Value |
|---|---|
| `--drawer-radius` | 1rem (top corners) |
| `--drawer-handle-w` / `--drawer-handle-h` | 40px / 6px |
| `--drawer-overlay` | `rgba(0,0,0,0.4)` |
| `--handle-pulse-duration-ms` | 1600 |

## Stepper { #stepper }

| Token | Value |
|---|---|
| `--chip-size` / `--chip-size-compact` | 28px / 24px |
| `--chip-active` | #b91c1c red-700 |
| `--chip-done` | #16a34a green-600 |
| `--chip-spring-stiffness` / `-damping` | 320 / 24 |

## Timeline { #timeline }

| Token | Value |
|---|---|
| `--timeline-rail-color` | #e4e4e7 zinc-200 |
| `--timeline-beam-from` / `-to` | #ef4444 / #b91c1c |
| `--timeline-dot-size` | 28px |
| `--timeline-step-gap` | 20px |

## Chart { #chart }

| Token | Value |
|---|---|
| `--chart-pipeline` | #b91c1c |
| `--chart-accepted` | #16a34a |
| `--chart-grid-dasharray` | `2 4` |
| `--chart-anim-duration-ms` / `-stagger-ms` | 800 / 200 |

## CTA { #cta }

| Token | Value |
|---|---|
| `--cta-primary-bg` / `-hover` | #1e293b slate-800 / #0f172a slate-900 |
| `--cta-primary-fg` | #ffffff |
| `--cta-destructive-bg` / `--brand-red` | #b91c1c red-700 |
| `--ring-color` | #b91c1c red-700 (focus) |

## Glass { #glass }

| Token | Value |
|---|---|
| `--surface-translucent-bg` | `rgba(255,255,255,0.72)` |
| `--surface-translucent-blur` | 8px |
| `--surface-translucent-border` | `rgba(255,255,255,0.6)` |
| `--page-bg` | #f4f4f5 zinc-100 |

## Mobile { #mobile }

| Token | Purpose |
|---|---|
| `--page-padding` | mobile page edge inset |
| `--row-card-gap` | gap between stacked list cards |
| `--row-card-border` | card row edge color |

## Motion { #motion }

| Token | Value |
|---|---|
| `--motion-duration-instant` | 80ms |
| `--motion-duration-quick` | 180ms |
| `--motion-duration-smooth` | 400ms |
| `--motion-ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--motion-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--shadow-focus` | `0 0 0 3px #fecaca` red-200 |

## v4 list / table archetype semantics

Broader semantic aliases applied across surfaces — not a locked primitive but used everywhere.

| Token | Value | Role |
|---|---|---|
| `--surface` | #ffffff | Card / table bg |
| `--surface-subtle` | #fafafa zinc-50 | Subtle bg |
| `--border-soft` / `--border-faint` | #ececee / #f1f1f3 | Divider tiers |
| `--fg` / `--fg-dim` / `--fg-muted` | #18181b / #27272a / #71717a | Text hierarchy |
| `--row-hover` | #f4f4f5 | Table row :hover |
| `--row-selected` | red-50 tinted | Table row :selected |

## Status palette

6 status tones × (bg + fg) — see [COLORS.md](./COLORS.md#status-palette).

## 📚 Related

- [src/index.css](../../../src/index.css) — canonical `@theme` block
- [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts) — TS mirror
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — per-slot lock rationale
- [COLORS.md](./COLORS.md) · [SPACING_MOTION.md](./SPACING_MOTION.md) · [TYPOGRAPHY.md](./TYPOGRAPHY.md)
