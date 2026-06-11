/**
 * LinkedEntityPill — colored-dot + label pill for cross-entity links.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-pill`)
 * Adopters: EmailDetailHeader. Reusable anywhere entity links need a quick visual cue
 * ("Linked to project #2154" · "Linked to quotation Q-20841" · etc.).
 *
 * Renders as an `<a>` when `href` is set, otherwise a plain `<span>`.
 */

import { forwardRef, createElement } from 'react';
import { cn } from '@/lib/utils';

interface LinkedEntityPillProps extends React.HTMLAttributes<HTMLElement> {
  /** Hex color for the leading dot. Defaults to zinc-500 if omitted. */
  dotColor?: string;
  /** If provided, renders as `<a>` with this href. Otherwise renders `<span>`. */
  href?: string;
  /** Optional leading icon (e.g. from lucide-react), sits before the dot. */
  icon?: React.ReactNode;
  /** Label content. */
  children: React.ReactNode;
}

export const LinkedEntityPill = forwardRef<HTMLElement, LinkedEntityPillProps>(
  function LinkedEntityPill({ dotColor, href, icon, className, children, ...props }, ref) {
    const Element = href ? 'a' : 'span';
    return createElement(
      Element,
      {
        ref: ref as React.Ref<HTMLElement>,
        href,
        className: cn(
          'inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full border',
          'text-[11px] font-medium whitespace-nowrap',
          'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300',
          href && 'hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer',
          href &&
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
          className,
        ),
        style: { fontFamily: 'var(--font-sans)' },
        ...props,
      },
      icon,
      <span
        key="dot"
        aria-hidden
        className="w-[5px] h-[5px] rounded-full shrink-0"
        style={{ background: dotColor ?? '#71717a' }}
      />,
      <span key="label" className="truncate">
        {children}
      </span>,
    );
  },
);
