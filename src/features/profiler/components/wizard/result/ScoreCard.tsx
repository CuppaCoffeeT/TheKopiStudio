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
          // --brown-text is calibrated for the flat cream grounds (4.54 / 5.21),
          // not for a brown wash of its own hue: on bg-accent/15 over card it
          // falls to 4.33:1. --brown-text-on-wash is the darker step for exactly
          // this case and reads 5.58:1, so the 15% fill can stay as designed.
          className="mb-2.5 inline-flex items-center rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-[color:var(--brown-text-on-wash)]"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600 }}
          data-testid="result-occupation-chip"
        >
          {/* Plain label — the legacy 👔 that prefixed this chip is gone; no
              emoji anywhere in /profiler. */}
          Occupation factored in: {profile.occUsed}
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
              {/* Track is the repetition hairline (--border-faint), the 2a bar
                  track — the secondary tint is too close to the card cream to
                  read as an unfilled remainder. */}
              <div
                className="h-2 overflow-hidden rounded-full bg-[color:var(--border-faint)]"
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
