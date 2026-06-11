# RAW_REQUIREMENTS — Intake

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-16 SGT
**Status**: 🟢 Production (locked — canonical intake record)
**Priority**: 🔴 Critical
**From**: weijie (solo dev)
**Source**: conversation verbatim + intake answers

## User's brain dump (verbatim)

> file structure is super messy — want to research the best way to organise everything (auth, react query, and everything), then organise files module-by-module with a centralised place for shared components, then modules become thin wrappers following DRY
>
> first map out: all modules → what components each has, which modules have special/delicate components, what each uses
>
> now there are a lot of random bugs, inconsistent design throughout the application, some modules unused, some components I thought were all the same but actually I need to edit all the places
>
> documentation should follow `/Volumes/YourVolume/CLAUDE.md` + `/Volumes/YourVolume/META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md`
>
> map out all processes — example "add new client contact" exists in 3 places (client contacts page, quotation page, project page) and they're all slightly different — figure out all functions/workflows across all modules
>
> build Playwright testing for all functions/workflows before pushing to prod
>
> currently keep pushing out without testing then firefight, plus building on top of poor foundation
>
> supabase has a lot of deprecated stuff — openclaw agent no longer used, email inbox is now a new claude agent not openclaw
>
> build new /skills and commands to create new modules/functions similar to `/Volumes/YourVolume/.claude/commands/create-guide.md` and `/Volumes/YourVolume/.claude/commands/create-workflow.md`
>
> new UI/UX design — currently feels like "AI slob", generic font, no animation, typical component — need full animation, clean design, mobile responsive, all consistent. Reference: `/Volumes/YourVolume/JLCD_COMPANY/DEVELOPER/CRON_MANAGER/_planning/1_RESEARCH/UI_UX_DESIGN.md`
>
> scared if I refactor it stops working — can't have the system down for even 1 day. Considered a new repo but afraid of drift. Landed on: refactor in place with seatbelt
>
> supabase branching broken — lost old migrations, tried to fix twice already with older AI
>
> sequence you want: brain dump → research → overview + state → list of modules + prompts per module → plan of what to do → first thing: Supabase testing + staging branch

## Intake answers (verbatim)

| # | Question | Answer |
|---|---|---|
| 1 | Vision in 2 sentences | "a visually consistent, don't look like AI Slob, bug free/minimal, reusable component internal application, that we do not need to keep maintaining every single hour (you can refine this vision again)" |
| 2 | Out of scope | "the out of scope once we do research of each of the module then we will decide again what not to touch" |
| 3 | Timeline | 5 weeks |
| 4 | Who else touches repo during refactor | only me |
| 5 | Freeze features or ship in parallel | "ship in parallel, but create a function to tell you that there are new functions/modules" |
| 6 | Supabase staging | "no new project, either fix branching or we edit on live database, which is what we have been doing for the last 1 year (tried to fix it twice but the AI back then sucks and can't debug so we proceeded with using it)" |
| 7 | UI/UX doc final? | "no it's not final we need to do deep research and see how to design for this application, it should look minimalistic but everywhere animation, non AI slop fonts, mobile friendly and look like a million dollar" |
| 8 | Refactor dashboard page vs markdown only | "yes do this, both system_state and refactor, or the refactor-status page can be from the system_state.md?" — interpreted: page renders from SYSTEM_STATE.md (single source of truth) |

## Refined vision (draft — user to accept or override)

Transform AppBase from a bug-prone, inconsistently-styled prototype into a visually polished, component-DRY internal app that compounds rather than firefights. Every module shares one shell (auth, queries, forms, tables, design tokens, motion) so one fix lands everywhere, every workflow is seat-belted by Playwright before prod, and new modules scaffold via skills so the shape can't drift.

## Constraints (hard)

- **No downtime** — production your-app.example.com must stay up every day of the refactor
- **No feature freeze** — parallel shipping is expected; drift detector (W05) flags new work
- **Solo dev** — no team coordination, but no team to help if stuck either
- **5-week soft target** — W01..W08 must land inside that window; W09 migration can trail
- **Broken Supabase branching** — must either fix (attempt #3) or formalize live-DB workflow; blocks real staging

## Related

- [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) — backlog + X-decisions
- [SYSTEM_STATE.md](SYSTEM_STATE.md) — rolling status
- [research/](research/) — evidence base (2 agents running)
- Root CLAUDE.md — repo rules
- [/Volumes/YourVolume/META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md) — tenets this system follows
