/**
 * MbtiCard — MBTI dimension block (legacy `resultHTML` dims loop): E/I, S/N,
 * T/F, J/P in order. Winner is `sa >= sb` (ties favour the first pole), bar
 * strength is win/total. Zero-signal dimensions show "No signals yet" with a
 * 50% bar — exact legacy zero-state.
 */

import { Card } from '@/components/primitives/shell/Card';
import { MBTI_DIMENSIONS } from '../../../lib/labels';
import type { MbtiSignals } from '../../../lib/scoring';
import { Eyebrow } from '../WizardAtoms';

export function MbtiCard({ signals }: { signals: MbtiSignals }) {
  return (
    <Card data-testid="result-mbti-card">
      <Eyebrow>MBTI Result</Eyebrow>
      <div className="flex flex-col gap-2.5">
        {MBTI_DIMENSIONS.map((dim) => {
          const sa = signals[dim.a];
          const sb = signals[dim.b];
          const total = sa + sb;
          const aWins = sa >= sb;
          const winLabel = aWins ? dim.la : dim.lb;
          const loseLabel = aWins ? dim.lb : dim.la;
          const winScore = aWins ? sa : sb;
          const loseScore = aWins ? sb : sa;
          const barPc = total > 0 ? Math.round((winScore / total) * 100) : 50;
          return (
            <div
              key={`${dim.a}${dim.b}`}
              className="rounded-xl border border-border/80 bg-secondary p-3"
              data-testid={`result-mbti-dim-${dim.a}${dim.b}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className="text-[color:var(--brown-text)]"
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700 }}
                >
                  {total === 0
                    ? 'No signals yet'
                    : `${winLabel} → ${winScore} signal${winScore !== 1 ? 's' : ''}`}
                </span>
                {/* 10px on the --secondary tile fill, where --fg-muted is
                    4.37:1 — the smallest type in the report takes --fg-dim
                    (6.79:1). Same for the strength line below. */}
                <span className="text-[color:var(--fg-dim)]" style={{ fontSize: 10 }}>
                  vs {loseLabel}
                  {total === 0 ? '' : ` (${loseScore})`}
                </span>
              </div>
              {/* Same 2a bar track as ScoreCard. The page token used to recess
                  this strip against a raised card; on the cream ground it is
                  within a hair of the tile fill, so the hairline carries it. */}
              <div
                className="h-2 overflow-hidden rounded-full bg-[color:var(--border-faint)]"
                role="progressbar"
                aria-label={`${dim.la} vs ${dim.lb} strength`}
                aria-valuenow={barPc}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${barPc}%` }}
                />
              </div>
              <div className="mt-1.5 text-[color:var(--fg-dim)]" style={{ fontSize: 10 }}>
                {total === 0 ? 'Answer questions to see this' : `Strength: ${barPc}%`}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
