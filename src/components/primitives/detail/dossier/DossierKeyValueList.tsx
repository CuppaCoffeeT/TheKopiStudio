/**
 * DossierKeyValueList — the 2a detail reference panel's label/value rows.
 *
 * Flex column, 10px gaps, 13px: `--fg-muted` label left, ink value RIGHT-
 * aligned. No hairlines between rows — in 2a the gap alone separates them.
 * Rendered as a `<dl>` so the pairing survives a screen reader.
 *
 * Spec: KOPI_2A_SPEC.md → "Archetype — detail" → Reference panel.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DossierKeyValue {
  label: ReactNode;
  value: ReactNode;
  /** Forwarded as `data-testid` on the value cell. */
  testId?: string;
}

interface DossierKeyValueListProps {
  rows: DossierKeyValue[];
  className?: string;
}

export function DossierKeyValueList({ rows, className }: DossierKeyValueListProps) {
  return (
    <dl className={cn('m-0 flex flex-col gap-2.5 text-[13px]', className)}>
      {rows.map((row, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
          <dd
            className="m-0 min-w-0 break-words text-right text-foreground"
            data-testid={row.testId}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
