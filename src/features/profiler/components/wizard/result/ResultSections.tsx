/**
 * ResultSections — the small single-purpose report panels (legacy
 * `resultHTML` order): opening line, traits, conversation style + watch-for,
 * follow-up style and notes. Kept together to avoid five 30-line files;
 * each renders one section in the frozen legacy order.
 *
 * `Card` + `Eyebrow` → `ToolPanel` (2026-08-19, tool-shell alignment): the
 * uppercase 11px `.12em` label is the treatment KOPI_2A_SPEC specifies for a
 * panel, and the one tools 04–06 already use. `Eyebrow` was the MASTHEAD
 * kicker doing that job.
 *
 * The AA reasoning below is unchanged and still load-bearing — only the label's
 * size and tracking moved. Every tinted panel passes `labelClassName` to keep
 * `--fg-dim`, because `ToolPanel`'s default muted label is calibrated for flat
 * cream and measures 3.73–3.83:1 on the DISC tints.
 */

import { ToolPanel } from '@/components/primitives/tools';
import type { DiscProfile } from '../../../types';

/** Tinted panels keep the eyebrow's ink — see the file header. */
const TINTED_LABEL = 'text-[color:var(--fg-dim)]';

export function OpeningLineCard({ profile }: { profile: DiscProfile }) {
  return (
    <ToolPanel
      label="Try This Opening Line"
      labelClassName={TINTED_LABEL}
      style={{ borderColor: `${profile.col}44`, backgroundColor: `${profile.col}12` }}
      testId="result-opening-line"
    >
      {/* The inline DISC tint is a `style` background, so it wins over the
          panel's bg-card and composites over the PAGE cream — a ground neither
          the brand hex (fails as text) nor --fg-muted (3.73–3.83:1) survives.
          Identity therefore stays in the border/background tint and the label
          rides --fg-dim, which is 5.78–5.95:1 on all four tints. */}
      <p className="m-0 text-[14px] italic leading-7 text-foreground">{profile.op}</p>
    </ToolPanel>
  );
}

export function TraitsCard({ profile }: { profile: DiscProfile }) {
  return (
    <ToolPanel label="Personality Traits" testId="result-traits">
      <div className="flex flex-wrap gap-2">
        {profile.tr.map((trait) => (
          <span
            key={trait}
            // Foreground text + tinted bg/border (DiscChip pattern) — the brand
            // hex as text fails WCAG AA 4.5:1 on its own tint.
            className="rounded-full px-3 py-1 text-foreground"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: `${profile.col}22`,
              border: `1px solid ${profile.col}55`,
            }}
          >
            {trait}
          </span>
        ))}
      </div>
    </ToolPanel>
  );
}

export function StyleCard({ profile }: { profile: DiscProfile }) {
  return (
    <ToolPanel label="How to Run This Conversation" testId="result-style">
      <p className="m-0 text-[13px] leading-6 text-muted-foreground">{profile.st}</p>
      {/* Watch-For is the report's negative note, so it takes terracotta —
          tint fill + hairline, with the label on the AA-safe --negative-text
          (10px) and the body on the ink token. Terracotta never carries the
          body copy: it fails 4.5:1 raw and would flood the panel. The urgency
          is carried by that hue and the wording, not by the legacy ⚠ glyph —
          no emoji anywhere in /profiler. */}
      <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
        <div
          className="mb-1 uppercase text-[color:var(--negative-text)]"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em' }}
        >
          Watch For — Act Immediately
        </div>
        <p className="m-0 text-[12.5px] leading-6 text-foreground">{profile.wf}</p>
      </div>
    </ToolPanel>
  );
}

export function FollowUpCard({ profile }: { profile: DiscProfile }) {
  // Border-only accent — `bg-accent/10` replaced the panel's bg-card (twMerge)
  // and composited over the page cream, taking label + body to 3.68:1.
  return (
    <ToolPanel label="Follow-Up Style" className="border-accent/30" testId="result-follow-up">
      <p className="m-0 text-[13px] leading-6 text-muted-foreground">{profile.fu}</p>
    </ToolPanel>
  );
}

export function NotesCard({ notes }: { notes: string }) {
  return (
    <ToolPanel label="Notes" testId="result-notes-card">
      <p className="m-0 whitespace-pre-wrap text-[13px] italic leading-6 text-muted-foreground">
        {notes || 'No notes added yet.'}
      </p>
    </ToolPanel>
  );
}
