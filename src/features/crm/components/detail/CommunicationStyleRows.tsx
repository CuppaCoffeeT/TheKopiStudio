/**
 * CommunicationStyleRows — the linked-profiler-result rows inside the client
 * dossier's COMMUNICATION STYLE panel (extracted from OverviewTab 2026-07-25
 * when that file became the 2a dossier body).
 *
 * DISC colours are read from the shared `--disc-*` tokens rather than imported
 * from profiler: a cross-feature import is a dependency-cruiser error, so the
 * design system carries the taxonomy and both features reference it. The tokens
 * are the frozen legacy DISC hexes and are exempt from brown discipline — see
 * the "DISC taxonomy" block in src/index.css for the ruling and the measurements.
 */

import { Link } from 'react-router-dom';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import type { LinkedProfilerResult } from '../../types';

/** DISC quadrant → design-system token. Values live in src/index.css. */
const DISC_TOKENS: Record<string, string> = {
  D: 'var(--disc-d)',
  I: 'var(--disc-i)',
  S: 'var(--disc-s)',
  C: 'var(--disc-c)',
};
/** Toneless fallback for unexpected letters — never throws, just goes neutral. */
const DISC_NEUTRAL = 'var(--fg-muted)';

function DiscPill({ letter, emphasis }: { letter: string; emphasis: 'primary' | 'secondary' }) {
  // `color-mix` lets the tint and border derive from the token; appending hex
  // alpha (`${col}1A`) would force the values back into raw literals.
  const col = DISC_TOKENS[letter] ?? DISC_NEUTRAL;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium text-foreground ${
        emphasis === 'primary' ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-0.5 text-[10px] opacity-75'
      }`}
      style={{
        backgroundColor: `color-mix(in srgb, ${col} 10%, transparent)`,
        borderColor: `color-mix(in srgb, ${col} 35%, transparent)`,
      }}
    >
      {emphasis === 'primary' && (
        <span aria-hidden className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ backgroundColor: col }} />
      )}
      {letter}
    </span>
  );
}

export function CommunicationStyleRows({ rows }: { rows: LinkedProfilerResult[] }) {
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {rows.map((result) => (
        <li
          key={result.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-3 last:border-b-0 last:pb-0"
          data-testid={`clients-detail-comm-style-row-${result.id}`}
        >
          <span
            className="inline-flex items-center gap-1"
            aria-label={`DISC ${result.disc_primary} primary, ${result.disc_secondary} secondary`}
          >
            <DiscPill letter={result.disc_primary} emphasis="primary" />
            <DiscPill letter={result.disc_secondary} emphasis="secondary" />
          </span>
          <span className="text-[13px] font-medium text-foreground">MBTI {result.mbti}</span>
          <span className="text-[12px] text-muted-foreground">
            {formatDisplayDateLong(result.created_at)}
          </span>
          <Link
            to={`/profiler-results/${result.id}`}
            className="inline-flex min-h-11 items-center text-[12.5px] font-medium text-[color:var(--brown-text)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:ml-auto"
            data-testid={`clients-detail-view-playbook-${result.id}`}
          >
            View full playbook
          </Link>
        </li>
      ))}
    </ul>
  );
}
