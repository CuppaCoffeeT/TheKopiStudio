/**
 * ResultHero — report hero band (legacy `resultHTML` hero block): a flat tint
 * in the primary profile's colour, identity line, DISC/MBTI badges and the
 * "Advisor Quick Read" strip.
 *
 * The DISC hue is a TINT over the cream ground, never a saturated slab: type
 * sits on the ink ladder (`--fg` / `--fg-dim`) exactly as it does in DiscChip
 * and TraitsCard, so contrast is independent of which DISC colour won. At the
 * band's 14% fill the worst quadrant (C, on the page cream) still reads 8.72:1
 * for `--fg` and 5.24:1 for `--fg-dim`; `--fg-muted` would fail there (3.37:1)
 * and is why nothing in this band uses it.
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
        {/* Identity monogram. Replaces the 36px colour emoji (`p.em`) that used
            to float here — no emoji anywhere in /profiler, and intake,
            questions and observations already dropped theirs. The DISC letter
            in Instrument Serif is the same device (a display-size mark of the
            profile) without leaving the palette, and it rides --fg rather than
            p.col so the mark's contrast does not depend on which quadrant won.
            `PR[].em` stays in content/: that file is a frozen parity contract.
            aria-hidden — the DISC badge below announces the same letter. */}
        <span
          aria-hidden="true"
          className="float-right ml-3 text-[36px] leading-none text-foreground"
          style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
        >
          {profile.pri}
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
