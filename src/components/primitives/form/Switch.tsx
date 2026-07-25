import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Switch — 36×20 toggle; brand-brown track on, hairline track off.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked (2a): --primary brown track on / --input hairline track off (matches the shadcn
 * `ui/switch` contract); focus ring = --ring brown, never silent.
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
        disabled ? 'text-muted-foreground' : 'text-foreground',
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
            checked ? 'bg-primary' : 'bg-input',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full shadow',
              'transition-[left,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
              // Knob is the raised white surface in both states — it contrasts with the
              // brown on-track and the hairline off-track alike, so it never needs to flip.
              'bg-popover',
              checked ? 'left-[18px]' : 'left-0.5'
            )}
          />
        </span>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});
