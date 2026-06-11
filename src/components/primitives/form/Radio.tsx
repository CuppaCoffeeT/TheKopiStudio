import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Radio — 20×20 circular radio with CTA slate-800 fill dot when checked.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: CTA slate-800 dot; focus ring red-700 never silent.
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
        disabled ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-700 dark:text-zinc-300',
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
            'bg-white dark:bg-zinc-950',
            checked
              ? 'border-slate-800 dark:border-slate-100'
              : 'border-zinc-300 dark:border-zinc-700',
            !checked && !disabled && 'peer-hover:border-zinc-400 dark:peer-hover:border-zinc-600',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-red-700 dark:peer-focus-visible:ring-red-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-zinc-950'
          )}
        >
          {checked && (
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-100" />
          )}
        </span>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});
