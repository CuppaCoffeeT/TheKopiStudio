/**
 * DossierPanel — the 2a detail-archetype panel.
 *
 * A cream card (the shell `Card` primitive, so radius/border/shadow stay the
 * app-wide locked values) whose first line is the comp's uppercase tracked
 * label: 600 11px, tracking .12em, `--fg-muted`.
 *
 * AA note — the label is 11px, well under the 18px threshold, so the colour
 * matters: `--fg-muted` #7D6B5B measures 4.72:1 on the CARD cream #FAF6EE it
 * always sits on (it would be 4.12:1 and fail on the page cream). Panels are
 * cards by construction; do not lift this label onto the page ground without
 * stepping it to `--fg-dim`.
 *
 * Padding is the comp's 22px (Card's default p-5 is 20px, the KPI-tile value).
 * Label bottom margin follows the comp's three densities: 16px stat · 14px
 * list · 12px prose.
 *
 * Spec: docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md
 *       → "Archetype — detail" → Panels.
 */

import type { ReactNode } from 'react';
import { Card } from '@/components/primitives/shell/Card';
import { cn } from '@/lib/utils';

/** Which body the panel carries — drives only the label's bottom margin. */
export type DossierPanelDensity = 'stat' | 'list' | 'prose';

const LABEL_GAP: Record<DossierPanelDensity, string> = {
  stat: 'mb-4', // 16px — stat grid
  list: 'mb-3.5', // 14px — label/value rows
  prose: 'mb-3', // 12px — long-form copy
};

interface DossierPanelProps {
  /** Uppercase panel label, e.g. `"Financial position"` — cased by CSS, pass normal text. */
  label: ReactNode;
  density?: DossierPanelDensity;
  children: ReactNode;
  className?: string;
  /** Forwarded as `data-testid` for Playwright targeting. */
  testId?: string;
}

export function DossierPanel({
  label,
  density = 'list',
  children,
  className,
  testId,
}: DossierPanelProps) {
  return (
    <Card padding="p-[22px]" className={className} data-testid={testId}>
      <DossierPanelLabel className={LABEL_GAP[density]}>{label}</DossierPanelLabel>
      {children}
    </Card>
  );
}

/** The bare label, for surfaces that need it outside a `DossierPanel` card. */
export function DossierPanelLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-[11px] font-semibold uppercase leading-none tracking-[0.12em] text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
}
