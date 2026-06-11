import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { cn } from '@/lib/utils';
import { kpiTileTokens } from '@/lib/design/tokens';

/**
 * NumberTicker — spring-eased count-up for KPI values.
 *
 * Spec: docs/99-refactor/_system/design/session-03-dashboard/export/appbase/project/dashboard/DashAtoms.jsx (NumberTicker section)
 * Locked: stiffness 100 · damping 60 (LOCKED_PICKS v1 KpiTile tokens).
 * Adopters: tracked in DESIGN_CATALOG.md.
 */
interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  decimalPlaces?: number;
  format?: (n: number) => string;
  className?: string;
}

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  decimalPlaces = 0,
  format,
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const springValue = useSpring(motionValue, {
    stiffness: kpiTileTokens.tickerSpring.stiffness,
    damping: kpiTileTokens.tickerSpring.damping,
  });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      motionValue.set(direction === 'down' ? 0 : value);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [motionValue, isInView, delay, value, direction]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (!ref.current) return;
      const n = Number(latest.toFixed(decimalPlaces));
      ref.current.textContent = format
        ? format(n)
        : Intl.NumberFormat('en-SG', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(n);
    });
  }, [springValue, decimalPlaces, format]);

  return (
    <span ref={ref} className={cn('inline-block tabular-nums', className)}>
      {format ? format(0) : '0'}
    </span>
  );
}
