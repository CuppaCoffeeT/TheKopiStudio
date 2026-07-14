# Lessons — src/features/crm

Last Updated: 2026-07-14

## 2026-07-14 — getCurrentSingaporeTime() is browser-local; SGT display strings need an explicit timeZone

**What happened**: /dashboard's greeting ("Good morning") and date line claimed SGT but rendered in the browser's local timezone — `timeOfDayInSingapore()` called `getCurrentSingaporeTime().getHours()` and `getFormattedDate()` used raw `toLocaleDateString` with no `timeZone`.

**Root cause**: `getCurrentSingaporeTime()` (src/utils/timezoneUtils.ts) returns a plain `new Date()` — its NAME promises SGT, but `Date` getters (`getHours`, `getFullYear`, `toLocaleString` without `timeZone`) all read the browser's zone. It only "works" on SGT machines.

**Fix**: SGT display strings must go through a formatter with `timeZone: SINGAPORE_TIMEZONE` (`Intl.DateTimeFormat` or the `formatDisplay*` timezoneUtils helpers). The dashboard greeting now uses `getSingaporeGreeting()` (src/utils/dashboardHelpers.ts) — one SGT-aware helper returning `{ timeOfDay, dateText }`. Audit note: other crm callsites still call `getCurrentSingaporeTime().getHours()/.toLocaleString('en-SG')`-style patterns (ReportDisclaimer, ReportHero, finance.ts refYear) — same latent trap on non-SGT browsers.
