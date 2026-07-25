/**
 * ResultHero — report hero band (legacy `resultHTML` hero block): a flat tint
 * in the primary profile's colour, identity line, DISC/MBTI badges and the
 * "Advisor Quick Read" strip.
 *
 * The DISC hue is a TINT over the card cream, never a saturated slab: type sits
 * on the ink ladder (`--fg` / `--fg-dim`) exactly as it does in DiscChip and
 * TraitsCard, so contrast is independent of which DISC colour won.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PR } from '../../../lib/content';
import type { ProfileResult } from '../../../lib/scoring';

interface ResultHeroProps {
  profile: ProfileResult;
  prospectName: string;
  advisorName: string;
  /** Age range ('' when not provided). */
  ageRange: string;
  occupation: string;
  meetingLabel: string;
  /** Display date (en-SG, e.g. "11 Jun 2026"). */
  dateLabel: string;
}

/**
 * Identity badge. The band behind it already carries the DISC hue, so the badge
 * itself is token-only — primary is a filled cream chip with ink type,
 * secondary an outlined chip a step down the ink ladder.
 */
function HeroBadge({ children, primary }: { children: ReactNode; primary?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1',
        primary ? 'bg-card text-foreground' : 'border border-border text-[color:var(--fg-dim)]',
      )}
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

export function ResultHero({
  profile,
  prospectName,
  advisorName,
  ageRange,
  occupation,
  meetingLabel,
  dateLabel,
}: ResultHeroProps) {
  const p = PR[profile.pri];
  const s = PR[profile.sec];

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: `${p.col}55` }}
      data-testid="result-hero"
    >
      <div className="px-4 pt-5 pb-3.5" style={{ backgroundColor: `${p.col}24` }}>
        <span className="float-right text-4xl" aria-hidden="true">
          {p.em}
        </span>
        <div
          className="uppercase mb-1 text-[color:var(--fg-dim)]"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '0.25em' }}
        >
          {meetingLabel} · {advisorName} · {dateLabel}
        </div>
        <div className="text-[22px] font-normal text-foreground">{prospectName}</div>
        <div className="mb-2.5 text-[color:var(--fg-dim)]" style={{ fontSize: 12 }}>
          {occupation}
          {ageRange ? `${occupation ? ' · ' : ''}Age ${ageRange}` : ''}
        </div>
        <div className="flex flex-wrap gap-2">
          <HeroBadge primary>
            DISC-{profile.pri} · {p.nm}
          </HeroBadge>
          <HeroBadge>
            Secondary: {profile.sec} · {s.nm}
          </HeroBadge>
          <HeroBadge>
            MBTI: {profile.mbs} · {p.mb}
          </HeroBadge>
        </div>
      </div>
      {/* Card cream under the tinted band, closed by a hairline — the colour
          step plus the rule separate the strip, no shadow and no dark backing. */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div
          className="uppercase mb-1 text-[color:var(--brown-text)]"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '0.25em' }}
        >
          Advisor Quick Read
        </div>
        <div className="italic text-foreground/90" style={{ fontSize: 13, lineHeight: 1.7 }}>
          “{p.sg}”
        </div>
      </div>
    </div>
  );
}
