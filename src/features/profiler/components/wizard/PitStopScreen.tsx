/**
 * PitStopScreen — wizard screen 8 (prototype v6 `pitstopHTML`, 2026-09-25).
 *
 * After rapport + observations, before the money talk: a PROVISIONAL DISC
 * read (`lib/discovery.calcInterim` — rapport answers, ticks and occupation,
 * not the money anchor), how to steer the discovery questions for that
 * letter, and a preview of the four tracks to come. The discovery screen then
 * words its questions for the same letter. Nothing here is saved.
 *
 * The leaning panel takes the DISC tint exactly like the report's opening-line
 * panel, and for the same AA reason its label rides --fg-dim.
 */

import { ToolPanel } from '@/components/primitives/tools';
import { PIT_PREVIEW, PIT_STEER, PR } from '../../lib/content';
import type { InterimRead } from '../../lib/discovery';

interface PitStopScreenProps {
  interim: InterimRead;
  prospectName: string;
}

export function PitStopScreen({ interim, prospectName }: PitStopScreenProps) {
  const p = PR[interim.pri];

  return (
    <div className="flex flex-col gap-3" data-testid="wizard-pitstop-screen">
      <div className="border-b border-border pb-4">
        <h2
          className="m-0 text-[22px] leading-tight text-foreground"
          style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
        >
          Quick read on {prospectName}
        </h2>
        <p className="m-0 mt-1.5 text-[13px] leading-6 text-[color:var(--fg-dim)]">
          Provisional — the money talk will confirm or shift this.
        </p>
      </div>

      <ToolPanel
        label="Leaning toward"
        labelClassName="text-[color:var(--fg-dim)]"
        style={{ borderColor: `${p.col}55`, backgroundColor: `${p.col}12` }}
        testId="wizard-pitstop-leaning"
      >
        <div
          className="text-[22px] leading-tight text-foreground"
          style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
        >
          DISC-{interim.pri} · {p.nm}
        </div>
        <div className="mt-1 text-[12px] text-[color:var(--fg-dim)]" data-testid="wizard-pitstop-confidence">
          {interim.conf} · with a {interim.sec} side
        </div>
        <p className="m-0 mt-3 border-t border-border pt-3 text-[12.5px] italic leading-6 text-foreground">
          {p.sg}
        </p>
      </ToolPanel>

      <ToolPanel label="So steer the money talk like this" testId="wizard-pitstop-steer">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {PIT_STEER[interim.pri].map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-[13px] leading-6 text-foreground">
              {/* A brown tick, not the legacy ✓ glyph in blue — no categorical hues in 2a. */}
              <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </ToolPanel>

      <ToolPanel label="Coming up — these break the ties" className="border-accent/30">
        <ol className="m-0 list-decimal pl-4 text-[13px] leading-7 text-muted-foreground">
          {PIT_PREVIEW.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </ToolPanel>
    </div>
  );
}
