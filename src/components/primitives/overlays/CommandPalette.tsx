import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GLASS_BACKDROP, GLASS_SURFACE } from './shared';
import { Kbd } from './Kbd';

/**
 * CommandPalette — ⌘K launcher. Wraps Radix Dialog + cmdk.
 *
 * Spec:
 *   - Glass Modal surface — design/session-02-overlays → `Modal` + `glassStyle`
 *   - Search row — design/session-02-overlays → `SMSPanel` search input
 *   - Result row — `OverlayPrimitives.jsx` → `MenuBase` items (atoms file)
 *   - Footer hints — `SearchableMultiSelect.jsx` footer block
 *
 * Scroll-reset (root-cause fix, 2026-05-27):
 *   cmdk's internal `re()` queries `[aria-selected="true"]` and calls
 *   `scrollIntoView` on it — but it runs in the same commit phase as `q()`'s
 *   DOM reorder, BEFORE React has committed the new aria-selected attribute.
 *   So the scroll targets the previously-selected item at its new shuffled
 *   position, not the new top match. Result: scroll drifts on every keystroke.
 *
 *   Fix: `Input` is uncontrolled (so cmdk's setState fires synchronously in
 *   the event handler, batching with our `queryTick` bump). The parent
 *   useLayoutEffect runs AFTER cmdk's `T` because child layout effects fire
 *   before parent ones — so our `scrollTo({top:0})` wins the race.
 */

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  placeholder?: string;
  children: ReactNode;
  className?: string;
  /** Controlled query — pair with `onQueryChange` for server-side search. */
  query?: string;
  /** Fires on every keystroke. Pair with `query` for server-side search. */
  onQueryChange?: (next: string) => void;
  /**
   * Disable cmdk's built-in fuzzy filter when results are filtered/ranked
   * server-side (otherwise cmdk hides rows whose `value` doesn't match).
   * Default `true` preserves legacy client-filtered behavior.
   */
  shouldFilter?: boolean;
}

export function CommandPalette({
  open,
  onOpenChange,
  placeholder = 'Search…',
  children,
  className,
  query,
  onQueryChange,
  shouldFilter = true,
}: CommandPaletteProps) {
  const [queryTick, setQueryTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [queryTick]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50',
            GLASS_BACKDROP,
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0'
          )}
        />
        <DialogPrimitive.Content
          aria-label="Command palette"
          className={cn(
            'fixed left-1/2 top-[20%] -translate-x-1/2 z-50',
            'w-[min(560px,calc(100vw-2rem))]',
            'rounded-xl overflow-hidden',
            GLASS_SURFACE,
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            className
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search and navigate. Use arrow keys to move, Enter to select, Escape to close.
          </DialogPrimitive.Description>

          <CommandPrimitive
            className="flex h-full w-full flex-col overflow-hidden"
            loop
            shouldFilter={shouldFilter}
          >
            <SearchRow
              placeholder={placeholder}
              value={query}
              onValueChange={(next) => {
                onQueryChange?.(next);
                setQueryTick((t) => t + 1);
              }}
            />
            <CommandPrimitive.List
              ref={listRef}
              className={cn(
                // Viewport-relative cap — list grows to fit content up to 70%
                // of the dynamic viewport (dvh handles the iOS URL bar correctly).
                // No fixed-pixel cap; previous min(400px,60vh) was arbitrary.
                'max-h-[70dvh] overflow-y-auto p-1',
                '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
                '[&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em]',
                '[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:font-medium'
              )}
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              {children}
            </CommandPrimitive.List>
            <Footer />
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function SearchRow({
  placeholder,
  value,
  onValueChange,
}: {
  placeholder: string;
  value?: string;
  onValueChange: (next: string) => void;
}) {
  return (
    <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border">
      <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.4} />
      <CommandPrimitive.Input
        placeholder={placeholder}
        value={value}
        onValueChange={onValueChange}
        className="flex-1 h-6 bg-transparent outline-none border-none text-[13px] text-foreground placeholder:text-muted-foreground"
        style={{ fontFamily: 'var(--font-sans)' }}
      />
      <Kbd>esc</Kbd>
    </div>
  );
}

function Footer() {
  return (
    <div className="px-3 py-2 flex gap-3 items-center border-t border-border bg-secondary">
      <Hint>
        <Kbd>↑↓</Kbd> navigate
      </Hint>
      <Hint>
        <Kbd>⏎</Kbd> select
      </Hint>
      <Hint>
        <Kbd>esc</Kbd> close
      </Hint>
    </div>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-[10px] text-muted-foreground flex items-center gap-1"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </span>
  );
}
