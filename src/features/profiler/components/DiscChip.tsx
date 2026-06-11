/**
 * DiscChip — StatusBadge-style primary/secondary DISC pill pair.
 *
 * Colour identity comes from the legacy profile palette (`PR[letter].col`)
 * applied to the dot + tinted background/border only; the letter itself stays
 * on the standard zinc text scale so contrast passes AA in both modes (the
 * mid-tone brand hexes fail 4.5:1 as text on dark surfaces).
 */

import { cn } from '@/lib/utils';
import { PR } from '../lib/content';
import type { DiscLetter } from '../types';

interface DiscLetterPillProps {
  letter: DiscLetter;
  emphasis: 'primary' | 'secondary';
}

function DiscLetterPill({ letter, emphasis }: DiscLetterPillProps) {
  const col = PR[letter].col;
  return (
    <span
      title={`${PR[letter].nm}${emphasis === 'secondary' ? ' (secondary)' : ''}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        'text-zinc-800 dark:text-zinc-100',
        emphasis === 'primary' ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-0.5 text-[10px] opacity-75',
      )}
      style={{
        backgroundColor: `${col}1A`,
        borderColor: `${col}59`,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {emphasis === 'primary' && (
        <span
          aria-hidden
          className="w-[5px] h-[5px] rounded-full shrink-0"
          style={{ backgroundColor: col }}
        />
      )}
      {letter}
    </span>
  );
}

export interface DiscChipProps {
  primary: DiscLetter;
  secondary: DiscLetter;
  'data-testid'?: string;
}

/** Renders e.g. ●D I — primary pill with colour dot, muted secondary pill. */
export function DiscChip({ primary, secondary, 'data-testid': testId }: DiscChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1"
      data-testid={testId}
      aria-label={`DISC ${PR[primary].nm} primary, ${PR[secondary].nm} secondary`}
    >
      <DiscLetterPill letter={primary} emphasis="primary" />
      <DiscLetterPill letter={secondary} emphasis="secondary" />
    </span>
  );
}
