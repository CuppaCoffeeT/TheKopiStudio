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
          'inline-flex items-end gap-0 border-b border-border max-w-full overflow-x-auto overscroll-x-contain',
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
        'text-[13px] text-muted-foreground',
        'border-b-2 border-transparent',
        'hover:text-foreground',
        'data-[state=active]:text-foreground',
        'data-[state=active]:border-primary',
        'data-[state=active]:font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
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
        'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded',
        className,
      )}
      {...props}
    />
  );
});
