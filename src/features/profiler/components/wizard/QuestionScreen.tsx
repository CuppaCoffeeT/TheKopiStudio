/**
 * QuestionScreen — wizard screens 1–2 (legacy `qHTML`): one batch of 4
 * questions (0–3 or 4–7). Each question shows its phase tag, advisor tip and
 * 4 single-select options; selecting tints the row with the option's DISC
 * colour. The page's Next button stays disabled until all 4 are answered.
 *
 * ONE PANEL, FOUR QUESTIONS (2026-08-19, tool-shell alignment). The batch used
 * to be four stacked `Card`s — four boxes for one question set. 2a is explicit:
 * "Never nest boxed sub-cards — use a grid plus a hairline." So the batch is a
 * single `ToolPanel` (the same atom the tax tool's "Reliefs" panel uses to hold
 * its rows) and the questions inside it are separated by the repetition
 * hairline. Every `data-testid` is unchanged.
 */

import { Radio } from '@/components/primitives/form';
import { ToolPanel } from '@/components/primitives/tools';
import { cn } from '@/lib/utils';
import { QS, PR } from '../../lib/content';
import type { RawAnswer } from '../../types';
import { DiscBadge } from './WizardAtoms';

interface QuestionScreenProps {
  /** Question indexes for this screen: [0,1,2,3] or [4,5,6,7]. */
  batch: readonly number[];
  /** 1-based batch number — drives the "Questions 1-4 / 5-8" heading. */
  batchNumber: 1 | 2;
  answers: ReadonlyArray<RawAnswer | null>;
  onSelect: (qi: number, oi: number) => void;
}

export function QuestionScreen({ batch, batchNumber, answers, onSelect }: QuestionScreenProps) {
  const batchLabel = batchNumber === 1 ? '1-4' : '5-8';

  return (
    <div className="flex flex-col gap-3" data-testid={`wizard-questions-screen-${batchNumber}`}>
      {/* Section head, 2a type scale: Instrument Serif 22px ink closed by a
          hairline. Brown never carries a heading in this direction, so the
          title stays --fg. The "Questions 1-4" kicker that used to lead this
          block is gone: the panel below now carries that label, and stating the
          batch twice on one screen said it no better. Leading with the serif
          line also matches ObservationScreen's masthead. */}
      <div className="border-b border-border pb-4">
        {/* The sticky bar above already carries "Profiling {name}" — repeating
            it here said nothing (2026-08-05 copy pass). The heading now holds
            the instruction; the sub holds the judgement call. */}
        <h2
          className="m-0 text-[22px] leading-tight text-foreground"
          style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
        >
          Weave these into the conversation
        </h2>
        {/* This header block is outside the panel, so it paints on the page
            cream where --fg-muted is 4.12:1. --fg-dim reads 6.40:1; the
            Eyebrow above already defaults to it. */}
        <p className="m-0 mt-1.5 text-[13px] leading-6 text-[color:var(--fg-dim)]">
          Pick the closest match — a gut call beats deliberation.
        </p>
      </div>

      <ToolPanel label={`Questions ${batchLabel}`}>
        {batch.map((qi, position) => {
          const q = QS[qi];
          const isOpen = q.ph === 'open';
          return (
            <div
              key={qi}
              data-testid={`wizard-question-${qi}`}
              /* Repetition hairline as `border-top`, so the panel label's own
                 rule and the first question's rule do not double (2a: two
                 hairline tiers, `#e0d3c3` for repetition). */
              className={cn(
                position > 0 && 'mt-5 border-t border-[color:var(--border-faint)] pt-5',
              )}
            >
              {/* Phase tag. 2a admits no categorical hues, so the two phases
                  separate on the brown/neutral axis instead of brown vs blue:
                  Opening is the brown tint, Discovery an inert neutral. Both
                  labels are 9.5px, so both take AA-safe ink rather than the raw
                  brand brown or the muted token. Opening uses
                  --brown-text-on-wash, not --brown-text: on its own brown@15%
                  wash the latter is 4.33:1, the former 5.58:1. Keeping the wash
                  at 15% is what holds the brown/neutral axis apart from
                  Discovery's --secondary tint. */}
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-0.5 uppercase mb-2',
                  isOpen
                    ? 'bg-accent/15 text-[color:var(--brown-text-on-wash)]'
                    : 'bg-secondary text-[color:var(--fg-dim)]',
                )}
                style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em' }}
              >
                {isOpen ? 'Opening' : 'Discovery'}
              </span>
              {/* Advisor tip. The 💡 that used to prefix it is gone — 2a admits
                  no illustration and no icon, and a colour emoji is the one mark
                  the brown/neutral palette can never absorb. A neutral hairline
                  in the margin marks it as an aside instead; brown is reserved
                  for CTA, focus and index numerals. */}
              <p className="m-0 border-l border-border pl-2.5 text-[12px] italic leading-5 text-muted-foreground">
                {q.tip}
              </p>
              <p className="m-0 mt-1.5 mb-3 text-[15px] leading-6 text-foreground">{q.ask}</p>

              <div className="flex flex-col gap-2" role="radiogroup" aria-label={q.ask}>
                {q.opts.map((opt, oi) => {
                  const selected = answers[qi]?.oi === oi;
                  return (
                    <div
                      key={oi}
                      data-testid={`wizard-q${qi}-opt-${oi}`}
                      className={cn(
                        'rounded-xl border transition-colors',
                        !selected &&
                          'border-border hover:border-muted-foreground',
                      )}
                      style={
                        selected
                          ? { borderColor: PR[opt.d].col, backgroundColor: `${PR[opt.d].col}14` }
                          : undefined
                      }
                    >
                      <Radio
                        name={`wizard-q${qi}`}
                        value={String(oi)}
                        checked={selected}
                        onChange={() => onSelect(qi, oi)}
                        labelClassName="flex w-full items-start gap-3 p-3 min-h-[44px] [&>span:last-child]:flex-1 [&>span:last-child]:min-w-0"
                        label={
                          <span className="flex w-full items-start justify-between gap-3">
                            {/* Selected flips to the ink token, same as
                                ObservationScreen: the DISC tint that marks the
                                chosen row drops --fg-muted to 4.21–4.33:1, so the
                                one row that must read best was the one failing. */}
                            <span
                              className={cn(
                                'text-[13.5px] leading-5',
                                selected ? 'text-foreground' : 'text-muted-foreground',
                              )}
                            >
                              {opt.t}
                            </span>
                            <DiscBadge d={opt.d} className="mt-0.5" />
                          </span>
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </ToolPanel>
    </div>
  );
}
