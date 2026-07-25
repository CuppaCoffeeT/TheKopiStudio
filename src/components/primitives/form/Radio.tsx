import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Radio — 20×20 circular radio with a brand-brown fill dot when checked.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked (2a): checked ring + dot = --primary brown; focus ring = --ring brown, never silent.
 */

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
  labelClassName?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, checked, disabled, className, labelClassName, ...props },
  ref
) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2.5 select-none',
        disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
        'text-[14px]',
        disabled ? 'text-muted-foreground' : 'text-foreground',
        labelClassName
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <span className="relative inline-flex">
        <input
          ref={ref}
          type="radio"
          checked={checked}
          disabled={disabled}
          className={cn('peer sr-only', className)}
          {...props}
        />
        <span
          className={cn(
            'w-5 h-5 rounded-full inline-flex items-center justify-center flex-shrink-0',
            'border-[1.5px] transition-colors duration-150',
            'bg-card',
            checked ? 'border-primary' : 'border-border',
            !checked && !disabled && 'peer-hover:border-border',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background'
          )}
        >
          {checked && (
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          )}
        </span>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});
