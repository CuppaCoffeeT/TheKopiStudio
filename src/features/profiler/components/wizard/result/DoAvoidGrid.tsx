/**
 * DoAvoidGrid — "✓ Do This" / "✕ Avoid" two-column grid (legacy `.ddg`).
 * Single column on small screens for readable line lengths.
 */

import { Card } from '@/components/primitives/shell/Card';
import type { DiscProfile } from '../../../types';

function ItemList({ items, tone }: { items: readonly string[]; tone: 'do' | 'avoid' }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item) => (
        <li
          key={item}
          className={
            tone === 'do'
              ? 'rounded-lg bg-green-50 px-3 py-2 text-[12.5px] leading-5 text-green-900 dark:bg-green-950/40 dark:text-green-200'
              : 'rounded-lg bg-red-50 px-3 py-2 text-[12.5px] leading-5 text-red-900 dark:bg-red-950/40 dark:text-red-200'
          }
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function DoAvoidGrid({ profile }: { profile: DiscProfile }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="result-do-avoid-grid">
      <Card className="border-green-200/80 dark:border-green-900/60">
        <div
          className="mb-2.5 uppercase text-green-700 dark:text-green-400"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em' }}
        >
          ✓ Do This
        </div>
        <ItemList items={profile.dos} tone="do" />
      </Card>
      <Card className="border-red-200/80 dark:border-red-900/60">
        <div
          className="mb-2.5 uppercase text-red-700 dark:text-red-400"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em' }}
        >
          ✕ Avoid
        </div>
        <ItemList items={profile.dnts} tone="avoid" />
      </Card>
    </div>
  );
}
