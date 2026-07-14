/**
 * ScoreCard — DISC score block (legacy `resultHTML` score card): optional
 * "Occupation factored in" chip, "{q} questions + {n} observations" heading
 * and the four DISC bars rendered RELATIVE to the max score — the winner is
 * always 100%, labels show raw "{pts} pts".
 */

import { Card } from '@/components/primitives/shell/Card';
import { PR } from '../../../lib/content';
import type { ProfileResult } from '../../../lib/scoring';
import type { DiscLetter } from '../../../types';
import { Eyebrow } from '../WizardAtoms';

const DISC_ORDER: readonly DiscLetter[] = ['D', 'I', 'S', 'C'];

export function ScoreCard({ profile }: { profile: ProfileResult }) {
  const max = Math.max(profile.dc.D, profile.dc.I, profile.dc.S, profile.dc.C);

  return (
    <Card data-testid="result-score-card">
      {profile.occUsed && (
        <span
          className="mb-2.5 inline-flex items-center rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-accent"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600 }}
          data-testid="result-occupation-chip"
        >
          👔 Occupation factored in: {profile.occUsed}
        </span>
      )}
      <Eyebrow>
        DISC Score · {profile.qCount} questions + {profile.nvCount} observations
      </Eyebrow>
      <div className="flex flex-col gap-3">
        {DISC_ORDER.map((d) => {
          const pts = profile.dc[d];
          const widthPc = max > 0 ? Math.round((pts / max) * 100) : 0;
          return (
            <div key={d} data-testid={`result-score-row-${d}`}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                {/* Foreground token — the brand hex fails WCAG AA 4.5:1 as text
                    on the card (the coloured bar carries the DISC identity). */}
                <span
                  className="text-foreground"
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}
                >
                  DISC-{d} — {PR[d].nm}
                </span>
                <span
                  className="tabular-nums text-muted-foreground"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}
                >
                  {pts} pts
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-label={`DISC-${d} score`}
                aria-valuenow={widthPc}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${widthPc}%`, background: PR[d].col }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
