/**
 * Tabs — underline-style content tabs (Radix-based).
 *
 * Low-level primitive for in-page content tabs (detail pages, dialogs).
 * Different use case than `TabNav` (sticky top-of-page navigation) and
 * `StatusTabs` (list-archetype status segment bar).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-28-OOvqzmEe/project/preview/component-tabs.html
 *       (axe-playwright contrast fix · 2026-04-28 · zinc-500→zinc-600 light · zinc-400→zinc-300 dark)
 *
 * Styling locked to AppBase tokens: slate-800 active underline · red-700
 * focus ring · no colored backgrounds. Active label is font-medium.
 *
 * Mobile: horizontal-scroll when content overflows (`overflow-x-auto`).
 * Replaces shadcn `@/components/ui/tabs` for new code.
 *
 * Note: the 2026-05-27 popover-on-overflow variant was removed because
 * the off-screen-strip + Popover-trigger pattern raced with Radix's
 * value-change machinery in mobile-safari and broke `pickTab` activation.
 * Horizontal scroll is a simpler UX that works in every test harness.
 */

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

export const TabsList = forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  function TabsList({ className, ...props }, forwardedRef) {
    return (
      <TabsPrimitive.List
        ref={forwardedRef}
        className={cn(
          'inline-flex items-end gap-0 border-b border-zinc-200 dark:border-zinc-800 max-w-full overflow-x-auto overscroll-x-contain',
          className,
        )}
        {...props}
      />
    );
  },
);

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'relative -mb-px h-9 px-3.5 inline-flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap',
        'text-[13px] text-zinc-600 dark:text-zinc-300',
        'border-b-2 border-transparent',
        'hover:text-zinc-900 dark:hover:text-zinc-50',
        'data-[state=active]:text-zinc-900 data-[state=active]:dark:text-zinc-50',
        'data-[state=active]:border-slate-800 data-[state=active]:dark:border-slate-100',
        'data-[state=active]:font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
        'disabled:pointer-events-none disabled:opacity-50',
        'transition-colors',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    />
  );
});

export const TabsContent = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 rounded',
        className,
      )}
      {...props}
    />
  );
});
