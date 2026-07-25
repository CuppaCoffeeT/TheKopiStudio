/**
 * QuestionScreen — wizard screens 1–2 (legacy `qHTML`): one batch of 4
 * questions (0–3 or 4–7). Each question shows its phase tag, advisor tip and
 * 4 single-select options; selecting tints the row with the option's DISC
 * colour. The page's Next button stays disabled until all 4 are answered.
 */

import { Card } from '@/components/primitives/shell/Card';
import { Radio } from '@/components/primitives/form';
import { cn } from '@/lib/utils';
import { QS, PR } from '../../lib/content';
import type { RawAnswer } from '../../types';
import { DiscBadge, Eyebrow } from './WizardAtoms';

interface QuestionScreenProps {
  /** Question indexes for this screen: [0,1,2,3] or [4,5,6,7]. */
  batch: readonly number[];
  /** 1-based batch number — drives the "Questions 1-4 / 5-8" heading. */
  batchNumber: 1 | 2;
  prospectName: string;
  answers: ReadonlyArray<RawAnswer | null>;
  onSelect: (qi: number, oi: number) => void;
}

export function QuestionScreen({ batch, batchNumber, prospectName, answers, onSelect }: QuestionScreenProps) {
  return (
    <div className="flex flex-col gap-3" data-testid={`wizard-questions-screen-${batchNumber}`}>
      <div>
        <Eyebrow>Questions {batchNumber === 1 ? '1-4' : '5-8'}</Eyebrow>
        <h2 className="m-0 text-[19px] font-normal text-foreground">
          Profiling {prospectName}
        </h2>
        {/* This header block is outside the per-question Card, so it paints on
            the page cream where --fg-muted is 4.12:1. --fg-dim reads 6.40:1;
            the Eyebrow above already defaults to it. */}
        <p className="m-0 mt-1 text-[13px] leading-6 text-[color:var(--fg-dim)]">
          Weave into conversation. Pick the best match.
        </p>
      </div>

      {batch.map((qi) => {
        const q = QS[qi];
        const isOpen = q.ph === 'open';
        return (
          <Card key={qi} data-testid={`wizard-question-${qi}`}>
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
            <p className="m-0 text-[12px] italic leading-5 text-muted-foreground">💡 {q.tip}</p>
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
          </Card>
        );
      })}
    </div>
  );
}
