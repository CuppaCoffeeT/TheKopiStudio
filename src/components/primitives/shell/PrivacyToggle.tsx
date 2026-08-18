/**
 * PrivacyToggle — the eye that hides names and money across the shell.
 *
 * Homed on the surfaces that show the book at a glance (the Overview masthead,
 * the Customers list header), not in global chrome: the control belongs beside
 * the thing it hides, which is how a banking app teaches it in one glance.
 *
 * The accessible name states the ACTION, not the state ("Show sensitive
 * information"), and `aria-pressed` carries the state — the pairing screen
 * readers announce correctly. The icon flips Eye ⇄ EyeOff to match.
 */

import { Eye, EyeOff } from 'lucide-react';
import { useMask } from '@/contexts/MaskContext';
import { cn } from '@/lib/utils';

interface PrivacyToggleProps {
  className?: string;
  /** Adds the "Hidden"/"Shown" word beside the icon. Off in tight rows. */
  showLabel?: boolean;
}

export function PrivacyToggle({ className, showLabel = false }: PrivacyToggleProps) {
  const { masked, toggleMask } = useMask();
  const Icon = masked ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={toggleMask}
      aria-pressed={masked}
      aria-label={masked ? 'Show sensitive information' : 'Hide sensitive information'}
      data-testid="privacy-toggle"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-muted-foreground',
        'transition-colors hover:bg-[color:var(--surface-subtle)] hover:text-[color:var(--brown-text)]',
        'focus-visible:outline-2 focus-visible:outline-[color:hsl(var(--ring))] focus-visible:outline-offset-2',
        'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
        className,
      )}
    >
      <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
      {showLabel && <span>{masked ? 'Hidden' : 'Shown'}</span>}
    </button>
  );
}
