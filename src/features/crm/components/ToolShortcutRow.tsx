/**
 * ToolShortcutRow — the six tools as one row of buttons under the Overview
 * figures.
 *
 * Presentation only: it never navigates and never fetches. The page owns both
 * the picker and the router, so this component's whole job is to say WHICH tool
 * the advisor pressed.
 *
 * Buttons, not the record's `ToolCardTile` cards: a tile earns its size by
 * carrying per-customer state ("3 of 5 checks missing", "Locked"), and up here
 * no customer has been chosen yet, so there is no state to carry. Six
 * state-less cards would be a second, louder copy of the launcher sitting above
 * the queue this page exists to show.
 *
 * Icons carry the recognition instead of the 01–06 numerals used on the record:
 * the numerals mean "this is a sequence", which is true of the chain on a
 * customer's page and false of a flat launcher.
 */

import { Button } from '@/components/primitives/shell/Button';
import type { ToolShortcut } from '../lib/dashboardToolShortcuts';

interface ToolShortcutRowProps {
  shortcuts: ToolShortcut[];
  onPick: (shortcut: ToolShortcut) => void;
}

export function ToolShortcutRow({ shortcuts, onPick }: ToolShortcutRowProps) {
  if (shortcuts.length === 0) return null;

  return (
    <section
      aria-labelledby="home-tools-heading"
      data-testid="home-tool-shortcuts"
      className="mt-[26px]"
    >
      {/* h2, not h1 — the greeting is this page's only h1 (testid contract). */}
      <h2
        id="home-tools-heading"
        className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--fg-dim)]"
      >
        Tools
      </h2>
      {/*
       * Two-up on phones and three-up on tablets rather than a scroller: every
       * label stays readable and nothing hides off-screen. Six-up only at lg,
       * where the 5xl measure gives each button room for its full name.
       */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Button
              key={shortcut.key}
              variant="outline"
              size="sm"
              // `bg-card`: these sit on the PAGE cream between two raised
              // surfaces (the stat strip above, the queue bands below), and
              // `outline`'s transparent rest made them read as holes in the
              // ladder. Resting on card cream forces the hover off `bg-card`
              // too — same-as-resting hover is invisible
              // (.claude/rules/light-theme.md) — so it takes the brown wash the
              // queue rows use.
              //
              // `justify-start` + `text-left`: Button centres by default, which
              // ragged two-line labels turn into a jagged row.
              className="h-auto min-h-11 w-full justify-start whitespace-normal bg-card px-3 py-2.5 text-left hover:bg-[color:var(--row-hover)] active:bg-[color:var(--row-selected)]"
              leadingIcon={<Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
              onClick={() => onPick(shortcut)}
              data-testid={`home-tool-shortcut-${shortcut.key}`}
            >
              <span className="min-w-0 leading-tight">{shortcut.label}</span>
            </Button>
          );
        })}
      </div>
      <p className="m-0 mt-2 text-[11.5px] leading-tight text-muted-foreground">
        Pick a tool, then choose which of your customers to open it for.
      </p>
    </section>
  );
}
