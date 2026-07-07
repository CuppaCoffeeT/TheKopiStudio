import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Switch — 36×20 toggle; slate-800 track on, zinc-300 track off.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: CTA slate-800 track on; focus ring red-700 never silent.
 */

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  label?: React.ReactNode;
  labelClassName?: string;
  /** Native input onChange (event) — coexists with `onCheckedChange` for shadcn compatibility. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** Shadcn/Radix-style callback receiving the next boolean checked state. Use this in new code. */
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, checked, disabled, className, labelClassName, onChange, onCheckedChange, ...props },
  ref
) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange?.(e);
    onCheckedChange?.(e.currentTarget.checked);
  };
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2.5 select-none',
        disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
        'text-[14px]',
        disabled ? 'text-muted-foreground' : 'text-muted-foreground',
        labelClassName
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <span className="relative inline-flex">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className={cn('peer sr-only appearance-none', className)}
          {...props}
        />
        <span
          className={cn(
            'relative inline-block w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200',
            checked
              ? 'bg-slate-800 dark:bg-slate-100'
              : 'bg-zinc-300 dark:bg-zinc-700',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full shadow',
              'transition-[left,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
              // Knob colour must contrast with the track:
              //   light mode: white knob on slate-800 (on) or zinc-300 (off) — both work
              //   dark mode: track flips to slate-100 (on) — knob must darken to slate-900;
              //              when off (dark:bg-zinc-700) keep zinc-50 for visibility
              checked
                ? 'bg-white dark:bg-slate-900'
                : 'bg-white dark:bg-zinc-50',
              checked ? 'left-[18px]' : 'left-0.5'
            )}
          />
        </span>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});
