/**
 * EmailSidebar — Gmail-style label rail for the email-inbox feature.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-side · .ei-side-hd · .ei-side-sec · .ei-nav · .ei-rail-ic · .ei-sync`)
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Two visual shapes:
 *   - `variant="expanded"` (240px) — account dropdown slot + label list + user
 *     labels + AI-category chips + sync footer.
 *   - `variant="rail"` (52px) — icon-only, tooltips on hover, count pip for unread.
 *
 * Pure layout/composition primitive. Data (labels, account list, AI categories)
 * is driven entirely by props — no Supabase / no auth logic.
 */

import { forwardRef, type ReactNode } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EmailSidebarVariant = 'expanded' | 'rail';

export interface EmailSidebarLabel {
  id: string;
  label: string;
  icon: ReactNode;
  count?: number;
  /** If true, the count badge renders with the critical red-8 fill. */
  critical?: boolean;
  /** Optional `data-testid` for the row button. */
  testId?: string;
}

export interface EmailSidebarUserLabel {
  id: string;
  label: string;
  color?: string | null;
  count?: number;
}

interface EmailSidebarProps {
  variant?: EmailSidebarVariant;
  /** Rendered in the top account-picker slot (expanded mode only). Feature layer provides. */
  accountSelect?: ReactNode;
  systemLabels: EmailSidebarLabel[];
  userLabels?: EmailSidebarUserLabel[];
  /** Active label id — matches an entry in `systemLabels` or `userLabels`. */
  activeLabelId: string;
  onLabelClick?: (labelId: string) => void;
  /** AI-category chips slot. Feature layer renders `<EmailCategoryBadge variant="filter" ... />` here. */
  categoriesSlot?: ReactNode;
  /** Sync handler. When null/undefined, hides the sync footer. */
  onSync?: () => void;
  syncPending?: boolean;
  /** Relative timestamp of last sync (e.g. "2m ago"). Shown under button. */
  lastSyncedLabel?: string;
  /** Called when user clicks the "+" next to a section header (add label). */
  onAddLabel?: () => void;
  className?: string;
}

function CountPill({ count, critical }: { count: number; critical?: boolean }) {
  return (
    <span
      className={cn(
        'ml-auto text-[10px] px-1.5 rounded-sm tabular-nums shrink-0',
        critical
          ? 'bg-red-700 text-white'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {count}
    </span>
  );
}

export const EmailSidebar = forwardRef<HTMLElement, EmailSidebarProps>(
  function EmailSidebar(
    {
      variant = 'expanded',
      accountSelect,
      systemLabels,
      userLabels = [],
      activeLabelId,
      onLabelClick,
      categoriesSlot,
      onSync,
      syncPending = false,
      lastSyncedLabel,
      onAddLabel,
      className,
    },
    ref,
  ) {
    if (variant === 'rail') {
      return (
        <aside
          ref={ref}
          className={cn(
            'w-[52px] flex flex-col shrink-0',
            'bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800',
            className,
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <div className="flex flex-col py-2 gap-0.5">
            {systemLabels.map((label) => {
              const isActive = label.id === activeLabelId;
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => onLabelClick?.(label.id)}
                  title={label.label}
                  aria-label={label.label}
                  className={cn(
                    'relative mx-2 w-9 h-9 rounded-lg inline-flex items-center justify-center',
                    'text-zinc-500 dark:text-zinc-400',
                    'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                    isActive && 'bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400',
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute -left-2 top-2 bottom-2 w-[3px] rounded-sm bg-red-700"
                    />
                  )}
                  <span className="w-4 h-4">{label.icon}</span>
                  {label.count !== undefined && label.count > 0 && (
                    <span
                      className={cn(
                        'absolute top-1 right-1 min-w-[14px] h-[14px] px-1 rounded-full',
                        'inline-flex items-center justify-center text-[9px] text-white tabular-nums',
                        label.critical || label.count >= 10 ? 'bg-red-700' : 'bg-zinc-500 dark:bg-zinc-600',
                      )}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {label.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      );
    }

    return (
      <aside
        ref={ref}
        className={cn(
          'w-[240px] flex flex-col shrink-0',
          'bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800',
          className,
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {accountSelect && (
          <div className="px-3 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
            {accountSelect}
          </div>
        )}

        <nav
          className="flex-1 overflow-y-auto py-2"
          aria-label="Email labels"
        >
          <SectionHeader heading="Labels" />
          <div className="px-2 flex flex-col">
            {systemLabels.map((label) => (
              <LabelRow
                key={label.id}
                labelDef={label}
                isActive={label.id === activeLabelId}
                onClick={() => onLabelClick?.(label.id)}
              />
            ))}
          </div>

          {userLabels.length > 0 && (
            <>
              <SectionHeader
                heading="User labels"
                actionLabel={onAddLabel ? 'Add label' : undefined}
                onAction={onAddLabel}
              />
              <div className="px-2 flex flex-col">
                {userLabels.map((ul) => (
                  <LabelRow
                    key={ul.id}
                    labelDef={{
                      id: ul.id,
                      label: ul.label,
                      icon: (
                        <span
                          aria-hidden
                          className="inline-block w-2 h-2 rounded-sm shrink-0"
                          style={{ background: ul.color ?? '#71717a' }}
                        />
                      ),
                      count: ul.count,
                    }}
                    isActive={ul.id === activeLabelId}
                    onClick={() => onLabelClick?.(ul.id)}
                  />
                ))}
              </div>
            </>
          )}

          {categoriesSlot && (
            <>
              <SectionHeader heading="AI Categories" mono />
              <div className="px-2 pb-2 flex flex-wrap gap-1.5">{categoriesSlot}</div>
            </>
          )}
        </nav>

        {onSync && (
          <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/60">
            <button
              type="button"
              onClick={onSync}
              disabled={syncPending}
              className={cn(
                'w-full h-8 inline-flex items-center justify-center gap-2 rounded-md',
                'border border-zinc-200 dark:border-zinc-800',
                'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300',
                'hover:bg-zinc-50 dark:hover:bg-zinc-900',
                'text-[12px] font-medium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
                'disabled:opacity-60 disabled:cursor-wait',
              )}
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5', syncPending && 'animate-spin')}
                aria-hidden
              />
              <span>{syncPending ? 'Syncing…' : 'Sync now'}</span>
              {lastSyncedLabel && !syncPending && (
                <span
                  className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {lastSyncedLabel}
                </span>
              )}
            </button>
          </div>
        )}
      </aside>
    );

    function SectionHeader({
      heading,
      mono = false,
      actionLabel,
      onAction,
    }: {
      heading: string;
      mono?: boolean;
      actionLabel?: string;
      onAction?: () => void;
    }) {
      return (
        <div
          className={cn(
            'flex items-center justify-between px-4 pt-2 pb-1.5',
            'text-[9.5px] uppercase tracking-[0.08em]',
            'text-zinc-500 dark:text-zinc-400',
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>{heading}</span>
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              aria-label={actionLabel}
              className={cn(
                'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 rounded-sm',
              )}
            >
              <Plus className="w-3 h-3" aria-hidden />
            </button>
          )}
        </div>
      );
    }

    function LabelRow({
      labelDef,
      isActive,
      onClick,
    }: {
      labelDef: EmailSidebarLabel;
      isActive: boolean;
      onClick: () => void;
    }) {
      return (
        <button
          type="button"
          onClick={onClick}
          aria-current={isActive ? 'true' : undefined}
          data-testid={labelDef.testId}
          className={cn(
            'relative flex items-center gap-2.5 h-[30px] px-2 rounded-md',
            'text-[12.5px]',
            'text-zinc-600 dark:text-zinc-400',
            'hover:bg-zinc-100 dark:hover:bg-zinc-800/60',
            isActive &&
              'bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400',
          )}
        >
          {isActive && (
            <span
              aria-hidden
              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-sm bg-red-700"
            />
          )}
          <span
            className={cn(
              'w-3.5 h-3.5 shrink-0',
              isActive
                ? 'text-zinc-700 dark:text-zinc-200'
                : 'text-zinc-500 dark:text-zinc-400',
            )}
          >
            {labelDef.icon}
          </span>
          <span className="truncate">{labelDef.label}</span>
          {labelDef.count !== undefined && labelDef.count > 0 && (
            <CountPill count={labelDef.count} critical={labelDef.critical} />
          )}
        </button>
      );
    }
  },
);
