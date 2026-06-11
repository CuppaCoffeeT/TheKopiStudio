/**
 * Avatar — W07 atom (extracted from Session 1 DataTable.jsx spec 2026-04-19).
 *
 * Circular initial-fallback avatar. Deterministic background colour via an
 * optional `color` prop, otherwise hash-derived from the initials. 4 sizes
 * match common tap-target + table-density needs.
 *
 * Deep import per Q-W07-b.
 *
 * @see docs/99-refactor/_system/DESIGN_CATALOG.md — Atoms group
 */
import { cn } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-5 h-5 text-[9px]',       // 20px — table row
  sm: 'w-[22px] h-[22px] text-[10px]', // 22px — Session 1 DataTable default
  md: 'w-7 h-7 text-[11px]',      // 28px — form field, stacked card
  lg: 'w-10 h-10 text-[13px]',    // 40px — profile header, detail hero
};

/**
 * Deterministic colour hash — ensures the same initials always get the same
 * colour across sessions without requiring a persisted colour map.
 * Returns a CSS colour-hash palette entry.
 */
function hashColour(key: string): string {
  // Small curated palette — picks that work against white and zinc-950.
  const palette = [
    '#475569', // slate-600
    '#b91c1c', // red-700 — brand accent
    '#15803d', // green-700
    '#c2410c', // orange-700
    '#7e22ce', // purple-700
    '#0f766e', // teal-700
    '#a16207', // amber-700
    '#0369a1', // sky-700
  ];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export interface AvatarProps {
  /** Initials (1-3 chars recommended). If omitted, falls back to '?'. */
  initials?: string;
  /** Explicit background colour. Overrides the hash. */
  color?: string;
  /** Size token. Default `sm` (22px) per Session 1 DataTable. */
  size?: AvatarSize;
  /** Optional accessibility label (full name behind initials). */
  label?: string;
  className?: string;
}

export function Avatar({ initials = '?', color, size = 'sm', label, className }: AvatarProps) {
  const bg = color ?? hashColour(initials);
  return (
    <span
      aria-label={label || initials}
      title={label || initials}
      className={cn(
        'inline-flex items-center justify-center rounded-full shrink-0 text-white font-semibold select-none',
        SIZE_CLASSES[size],
        className,
      )}
      style={{ background: bg, letterSpacing: '0.02em' }}
    >
      {initials.slice(0, 3)}
    </span>
  );
}
