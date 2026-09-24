/**
 * Fit finder tab — eight questions that shortlist an insurer. Tapping the
 * chosen answer again clears it. The sticky footer carries the running lean
 * and, once anything is answered, this age's premium gap.
 */

import { ToolNote } from '@/components/primitives/tools';
import { cn } from '@/lib/utils';
import { moneyCents } from '../../lib/format';
import { FIT_QUESTIONS, scoreFit, type FitAnswers, type FitScore } from '../../lib/shieldFit';
import type { ShieldPremium } from '../../lib/shieldPremium';

interface ShieldFitTabProps {
  answers: FitAnswers;
  onAnswer: (question: number, option: number | null) => void;
  age: number;
  premium: ShieldPremium;
}

const LEAN: Record<FitScore['lean'], string> = {
  none: 'Tap an answer to start',
  close: 'Too close to call — decide on premium and panel access',
  singlife: 'Leans Singlife',
  income: 'Leans Income',
};

export function ShieldFitTab({ answers, onAnswer, age, premium }: ShieldFitTabProps) {
  const score = scoreFit(answers);
  const gap = premium.income.cash - premium.singlife.cash;

  return (
    <div>
      {FIT_QUESTIONS.map((q, qi) => (
        <fieldset key={q.question} className="m-0 border-0 border-b border-border px-0 py-4">
          <legend className="float-left mb-2.5 w-full p-0 text-[14px] text-foreground">{q.question}</legend>
          <div className="clear-both flex flex-wrap gap-2">
            {q.options.map((option, oi) => {
              const pressed = answers[qi] === oi;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => onAnswer(qi, pressed ? null : oi)}
                  className={cn(
                    'min-h-11 rounded-lg border px-3.5 py-2 text-left text-[13.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    pressed
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-popover text-foreground hover:bg-secondary',
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <p className="m-0 mt-2.5 max-w-[70ch] text-[12.5px] leading-[1.55] text-muted-foreground">{q.why}</p>
        </fieldset>
      ))}

      <div
        className="sticky bottom-0 mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-foreground bg-background pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3.5"
        aria-live="polite"
        data-testid="shield-fit-score"
      >
        <p className="m-0 text-[18px] font-semibold text-foreground">{LEAN[score.lean]}</p>
        {score.answered > 0 && (
          <p className="m-0 text-[13px] text-[color:var(--fg-dim)]">
            Singlife {score.singlife} · Income {score.income}. At age {age}, Income costs {moneyCents(gap)} more a
            year.
          </p>
        )}
      </div>

      <ToolNote>
        A three-point answer means one insurer simply does not have the benefit. A one-pointer is a real
        but modest edge. This shortlists — it does not decide, and it cannot see underwriting. A loading or
        exclusion on either side overrides everything here.
      </ToolNote>
    </div>
  );
}
