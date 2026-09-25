/**
 * QuestionScreen — wizard screens 1–2, the RAPPORT questions (v6 `qHTML`):
 * Q0–3, then Q4–6. Each question shows its phase tag, advisor tip and 4
 * single-select options; selecting tints the row with the option's DISC
 * colour. The page's Next button stays disabled until the batch is answered.
 *
 * v6 (2026-09-25) moved the money-worry question (Q7) out of here to the
 * discovery screen, so batch 2 is three questions, and every question on these
 * screens is tagged "Rapport" — casual chit-chat before the money talk.
 *
 * ONE PANEL, SEVERAL QUESTIONS (2026-08-19, tool-shell alignment). The batch is
 * a single `ToolPanel` and the questions inside it are separated by the
 * repetition hairline — 2a: "Never nest boxed sub-cards — use a grid plus a
 * hairline." Every `data-testid` is unchanged.
 */

import { ToolPanel } from '@/components/primitives/tools';
import { QS } from '../../lib/content';
import type { RawAnswer } from '../../types';
import { DiscQuestionOptions, QuestionBlock } from './QuestionBlock';

interface QuestionScreenProps {
  /** Question indexes for this screen: [0,1,2,3] or [4,5,6]. */
  batch: readonly number[];
  /** 1-based batch number — drives the testid and the panel label. */
  batchNumber: 1 | 2;
  answers: ReadonlyArray<RawAnswer | null>;
  onSelect: (qi: number, oi: number) => void;
}

export function QuestionScreen({ batch, batchNumber, answers, onSelect }: QuestionScreenProps) {
  const range = `Q${batch[0] + 1}–${batch[batch.length - 1] + 1}`;

  return (
    <div className="flex flex-col gap-3" data-testid={`wizard-questions-screen-${batchNumber}`}>
      {/* Section head, 2a type scale: Instrument Serif 22px ink closed by a
          hairline. The sticky bar above already names the phase and the
          prospect ("Rapport · {name}"), so the heading holds the instruction
          and the sub the judgement call (2026-08-05 copy pass). */}
      <div className="border-b border-border pb-4">
        <h2
          className="m-0 text-[22px] leading-tight text-foreground"
          style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
        >
          Weave these into the conversation
        </h2>
        {/* Outside the panel = page cream, where --fg-muted is 4.12:1;
            --fg-dim reads 6.40:1. */}
        <p className="m-0 mt-1.5 text-[13px] leading-6 text-[color:var(--fg-dim)]">
          Casual chit-chat — tap the closest match. A gut call beats deliberation.
        </p>
      </div>

      <ToolPanel label={`Rapport · ${range}`}>
        {batch.map((qi, position) => (
          <QuestionBlock
            key={qi}
            tag="Rapport"
            tone="rapport"
            tip={QS[qi].tip}
            ask={QS[qi].ask}
            divided={position > 0}
            testId={`wizard-question-${qi}`}
          >
            <DiscQuestionOptions qi={qi} answers={answers} onSelect={onSelect} />
          </QuestionBlock>
        ))}
      </ToolPanel>
    </div>
  );
}
