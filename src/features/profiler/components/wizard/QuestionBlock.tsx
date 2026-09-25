/**
 * QuestionBlock — one question inside a wizard panel: phase tag, advisor tip,
 * the question as asked, then its option rows. Extracted from `QuestionScreen`
 * (2026-09-25) so the discovery screen renders its money anchor and its four
 * tracks with the same anatomy. `DiscQuestionOptions` renders a QS question's
 * four DISC options.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PR, QS } from '../../lib/content';
import type { RawAnswer } from '../../types';
import { DiscBadge } from './WizardAtoms';
import { OptionRow } from './OptionRow';

interface QuestionBlockProps {
  /** Phase tag text ("Rapport", "Money Anchor", the track's axis name). */
  tag: string;
  /** Brown tag for the rapport phase; the discovery phase takes the neutral. */
  tone: 'rapport' | 'discovery';
  tip: string;
  ask: string;
  /** Not the first block in its panel — draws the repetition hairline above. */
  divided: boolean;
  testId: string;
  children: ReactNode;
}

export function QuestionBlock({ tag, tone, tip, ask, divided, testId, children }: QuestionBlockProps) {
  return (
    <div
      data-testid={testId}
      /* Repetition hairline as `border-top`, so the panel label's own rule and
         the first question's rule do not double (2a: two hairline tiers,
         `#e0d3c3` for repetition). */
      className={cn(divided && 'mt-5 border-t border-[color:var(--border-faint)] pt-5')}
    >
      {/* Phase tag. 2a admits no categorical hues, so the phases separate on
          the brown/neutral axis: rapport is the brown tint, discovery an inert
          neutral. At 9.5px both take AA-safe ink: --brown-text-on-wash on its
          own brown@15% wash is 5.58:1 (--brown-text would be 4.33:1). */}
      <span
        className={cn(
          'inline-flex rounded-full px-2.5 py-0.5 uppercase mb-2',
          tone === 'rapport'
            ? 'bg-accent/15 text-[color:var(--brown-text-on-wash)]'
            : 'bg-secondary text-[color:var(--fg-dim)]',
        )}
        style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em' }}
      >
        {tag}
      </span>
      {/* Advisor tip. No 💡 — 2a admits no illustration or icon; a neutral
          hairline in the margin marks it as an aside instead. */}
      <p className="m-0 border-l border-border pl-2.5 text-[12px] italic leading-5 text-muted-foreground">
        {tip}
      </p>
      <p className="m-0 mt-1.5 mb-3 text-[15px] leading-6 text-foreground">{ask}</p>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={ask}>
        {children}
      </div>
    </div>
  );
}

interface DiscQuestionOptionsProps {
  qi: number;
  answers: ReadonlyArray<RawAnswer | null>;
  onSelect: (qi: number, oi: number) => void;
}

/**
 * The four DISC options of question `qi`. The DISC-X badge shows only on the
 * picked row (legacy `.dbg`): v6 shuffled the options precisely so the letter
 * cannot be read off the list, and a badge on every row would undo that.
 */
export function DiscQuestionOptions({ qi, answers, onSelect }: DiscQuestionOptionsProps) {
  return (
    <>
      {QS[qi].opts.map((opt, oi) => (
        <OptionRow
          key={oi}
          name={`wizard-q${qi}`}
          value={String(oi)}
          checked={answers[qi]?.oi === oi}
          onSelect={() => onSelect(qi, oi)}
          label={opt.t}
          tint={PR[opt.d].col}
          badge={<DiscBadge d={opt.d} className="mt-0.5" />}
          testId={`wizard-q${qi}-opt-${oi}`}
        />
      ))}
    </>
  );
}
