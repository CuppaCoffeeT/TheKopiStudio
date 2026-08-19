/**
 * ScoreCard — DISC score block (legacy `resultHTML` score card): optional
 * "Occupation factored in" chip, "{q} questions + {n} observations" label and
 * the four DISC scores.
 *
 * TWO READINGS OF ONE SET (2026-08-19, tool-shell alignment). The figures now
 * sit in a `ToolStatGrid` — the serif-numeral tiles the tax calculator heads
 * its page with — and the bars below carry only the SHAPE, scaled relative to
 * the max so the winner is always full width. The bars used to repeat each
 * figure as a "{pts} pts" label beside them; with the tiles above, that made
 * the same number twice on one card, so the bar rows are down to their letter.
 * `result-score-row-{D|I|S|C}` moved onto the tile with the number in it, which
 * is what `WizardPage.scorePoints()` reads.
 */

import { ToolPanel, ToolStatGrid } from '@/components/primitives/tools';
import { PR } from '../../../lib/content';
import type { ProfileResult } from '../../../lib/scoring';
import type { DiscLetter } from '../../../types';

const DISC_ORDER: readonly DiscLetter[] = ['D', 'I', 'S', 'C'];

export function ScoreCard({ profile }: { profile: ProfileResult }) {
  const max = Math.max(profile.dc.D, profile.dc.I, profile.dc.S, profile.dc.C);

  return (
    <ToolPanel
      label={`DISC score · ${profile.qCount} questions + ${profile.nvCount} observations`}
      testId="result-score-card"
    >
      {profile.occUsed && (
        <span
          // --brown-text is calibrated for the flat cream grounds (4.54 / 5.21),
          // not for a brown wash of its own hue: on bg-accent/15 over card it
          // falls to 4.33:1. --brown-text-on-wash is the darker step for exactly
          // this case and reads 5.58:1, so the 15% fill can stay as designed.
          className="mb-3.5 inline-flex items-center rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-[color:var(--brown-text-on-wash)]"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600 }}
          data-testid="result-occupation-chip"
        >
          {/* Plain label — the legacy 👔 that prefixed this chip is gone; no
              emoji anywhere in /profiler. */}
          Occupation factored in: {profile.occUsed}
        </span>
      )}

      <ToolStatGrid
        stats={DISC_ORDER.map((d) => ({
          // The unit rides in the value because `ToolStatGrid` takes one string
          // per tile, and "12" alone does not say what it counts.
          value: `${profile.dc[d]} pts`,
          label: `DISC-${d}`,
          hint: PR[d].nm,
          testId: `result-score-row-${d}`,
        }))}
      />

      <div className="mt-4 flex flex-col gap-2.5">
        {DISC_ORDER.map((d) => {
          const widthPc = max > 0 ? Math.round((profile.dc[d] / max) * 100) : 0;
          return (
            <div key={d} className="flex items-center gap-2.5">
              {/* Foreground token — the brand hex fails WCAG AA 4.5:1 as text
                  on the card (the coloured bar carries the DISC identity). */}
              <span
                className="w-[52px] flex-none text-foreground"
                style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600 }}
              >
                DISC-{d}
              </span>
              {/* Track is the repetition hairline (--border-faint), the 2a bar
                  track — the secondary tint is too close to the card cream to
                  read as an unfilled remainder. */}
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--border-faint)]"
                role="progressbar"
                aria-label={`DISC-${d} score, ${profile.dc[d]} points`}
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
    </ToolPanel>
  );
}
