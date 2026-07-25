/**
 * ResultSections — the small single-purpose report cards (legacy
 * `resultHTML` order): opening line, traits, conversation style + watch-for,
 * follow-up style and notes. Kept together to avoid five 30-line files;
 * each renders one section in the frozen legacy order.
 */

import { Card } from '@/components/primitives/shell/Card';
import type { DiscProfile } from '../../../types';
import { Eyebrow } from '../WizardAtoms';

export function OpeningLineCard({ profile }: { profile: DiscProfile }) {
  return (
    <Card
      style={{ borderColor: `${profile.col}44`, backgroundColor: `${profile.col}12` }}
      data-testid="result-opening-line"
    >
      {/* The inline DISC tint is a `style` background, so it wins over Card's
          bg-card and composites over the PAGE cream — a ground neither the brand
          hex (fails as text) nor --fg-muted (3.73–3.83:1) survives. Identity
          therefore stays in the border/background tint and the eyebrow rides
          Eyebrow's --fg-dim default, which is 5.78–5.95:1 on all four tints. */}
      <Eyebrow className="mb-1.5">Try This Opening Line</Eyebrow>
      <p className="m-0 text-[14px] italic leading-7 text-foreground">{profile.op}</p>
    </Card>
  );
}

export function TraitsCard({ profile }: { profile: DiscProfile }) {
  return (
    <Card data-testid="result-traits">
      <Eyebrow>Personality Traits</Eyebrow>
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
    </Card>
  );
}

export function StyleCard({ profile }: { profile: DiscProfile }) {
  return (
    <Card data-testid="result-style">
      <Eyebrow>How to Run This Conversation</Eyebrow>
      <p className="m-0 text-[13px] leading-6 text-muted-foreground">{profile.st}</p>
      {/* Watch-For is the report's negative note, so it takes terracotta —
          tint fill + hairline, with the label on the AA-safe --negative-text
          (10px) and the body on the ink token. Terracotta never carries the
          body copy: it fails 4.5:1 raw and would flood the card. The urgency
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
    </Card>
  );
}

export function FollowUpCard({ profile }: { profile: DiscProfile }) {
  // Border-only accent — `bg-accent/10` replaced Card's bg-card (twMerge) and
  // composited over the page cream, taking eyebrow + body to 3.68:1.
  return (
    <Card className="border-accent/30" data-testid="result-follow-up">
      <Eyebrow>Follow-Up Style</Eyebrow>
      <p className="m-0 text-[13px] leading-6 text-muted-foreground">{profile.fu}</p>
    </Card>
  );
}

export function NotesCard({ notes }: { notes: string }) {
  return (
    <Card data-testid="result-notes-card">
      <Eyebrow>Notes</Eyebrow>
      <p className="m-0 whitespace-pre-wrap text-[13px] italic leading-6 text-muted-foreground">
        {notes || 'No notes added yet.'}
      </p>
    </Card>
  );
}
