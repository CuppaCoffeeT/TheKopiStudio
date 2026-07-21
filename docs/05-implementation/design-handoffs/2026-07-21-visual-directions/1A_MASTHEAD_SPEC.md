# 1a "Masthead" — applied direction spec

Source: `Visual Directions.dc.html` (Claude Design project "Editorial direction exploration", option 1a, user-picked 2026-07-21). Base tokens (navy/gold/cream) were already live; this file records the 1a refinements.

## Palette (unchanged base, for reference)

page `#0D1B2A` · card `#12202F` · modal/inset `#182638` · border `#2E3D4D` (`--border-soft`) · row hairline `#22303F` (`--border-faint`) · cream `#F0EAD6` (`--fg`) · dim cream `#D6CCB4` (`--fg-dim`) · muted `#8A8070` (`--fg-muted`) · disabled `#4A4536` · gold `#C9A84C` (hover `#D9BC6A`, active `#B8973B`, on-gold text `#1A1200`).

## Gold discipline (the 1a rule)

Gold appears ONLY as: primary CTA · focus outline · index numerals (Georgia, e.g. card corner "01") · in-progress status badge · links. Nothing else — no gold icons, no gold section labels, no gold decorative fills. Hierarchy is carried by cream steps + hairlines instead.

## Type scale

| Role | Spec |
|---|---|
| Dateline / kicker | 600 11px system-ui · uppercase · tracking .14em · `--fg-muted` |
| Greeting (masthead) | Georgia 34px · `--fg` |
| Page title | Georgia 28px · `--fg` · inline count 15px `--fg-muted` |
| Section head | Georgia 18px · `--fg` · hairline `--border-soft` under the row |
| KPI numeral | Georgia 30px · `--fg` · unit 14px `--fg-dim` |
| Card label | 600 11px system-ui · uppercase · tracking .12em · `--fg-muted` |
| Table header | 600 10.5px system-ui · uppercase · tracking .1em · `--fg-muted` |
| Body / rows | 13px · `--fg-dim`; primary cell `--fg`; meta `--fg-muted` |

## Layout language

- Hairline rules do the layout work: section headers = flex row + `border-bottom: 1px solid var(--border-soft)`; table rows separated by `--border-faint` top borders; avoid nested boxed sub-cards.
- Cards: `#12202F`, 1px `--border-soft`, radius 12px, rest shadow `0 1px 2px rgba(0,0,0,.25)`, hover `0 4px 16px rgba(0,0,0,.35)`.
- Sidebar: 200px navy, item 13px; active = 2px gold left border + card bg + cream text; idle = muted, hover dim-cream + card bg; brand wordmark Georgia 17px cream with gold *italic* second word.

## Signature — dateline greeting masthead (dashboard)

Uppercase dateline (`Tuesday · 21 July 2026 · 4 reviews due this week`) over Georgia 34px greeting (`Good morning, Rachel.`), hairline below the block. Dateline carries one live context stat.

## States

- **Empty**: serif (Georgia) italic line + ONE quiet action (ghost/outline). No illustration. Alt: centered glyph is outlined gold, never filled.
- **Loading**: thin gold progress bar + serif italic verb ("Generating report…"). Skeleton rows keep navy shimmer tokens.
- **Error**: red never floods a card — `#E8836F` text + `rgba(192,57,43,.15)` tint + tinted border; body stays cream.
- **Status badges**: pill radius 99px, 11.5px; complete `#4ADE80` on `rgba(22,163,74,.15)`; in-progress gold on `rgba(201,168,76,.14)`; error `#E8836F` on `rgba(192,57,43,.15)`.

## Data-viz

Monochrome cream→gold only: primary series gold `#C9A84C`, secondary dim cream `#D6CCB4`, further series step down cream opacity. No green/blue/purple categoricals in charts (`--chart-accepted` repointed to `#d6ccb4`). Legend squares follow series colors. Grid stays dashed `2 4` muted.

## Buttons

Primary: gold bg / `#1A1200` text / radius 8px / 600 12.5px / hover `#D9BC6A` / active `#B8973B` / focus 2px gold outline offset 2. Secondary & ghost: cream text, hairline border or none, hover card bg. All 5 states mandatory.
