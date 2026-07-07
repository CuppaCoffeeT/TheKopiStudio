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
      {/* Eyebrow keeps its zinc text — the brand hex fails WCAG AA 4.5:1 on
          the tinted card; the border/background tint carries the identity. */}
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
            // Zinc text + tinted bg/border (DiscChip pattern) — the brand hex
            // as text fails WCAG AA 4.5:1 on its own tint.
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
      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
        <div
          className="mb-1 uppercase text-red-700 dark:text-red-400"
          style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em' }}
        >
          ⚠ Watch For — Act Immediately
        </div>
        <p className="m-0 text-[12.5px] leading-6 text-red-900 dark:text-red-200">{profile.wf}</p>
      </div>
    </Card>
  );
}

export function FollowUpCard({ profile }: { profile: DiscProfile }) {
  return (
    <Card className="border-amber-400/30 bg-amber-50/50 dark:bg-amber-950/15" data-testid="result-follow-up">
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
