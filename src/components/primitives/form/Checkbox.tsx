import { forwardRef, useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Checkbox — 20×20 brand-brown fill when checked; indeterminate dash.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked (2a): checked fill = --primary brown with --cta-primary-fg cream glyph;
 * focus ring = --ring brown, never silent.
 */

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  label?: React.ReactNode;
  indeterminate?: boolean;
  labelClassName?: string;
  /** Native input onChange (event) — coexists with `onCheckedChange` for shadcn compatibility. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** Shadcn/Radix-style callback receiving the next boolean checked state. Use this in new code. */
  onCheckedChange?: (checked: boolean) => void;
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    });
  };
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, indeterminate = false, checked, disabled, className, labelClassName, onChange, onCheckedChange, ...props },
  ref
) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange?.(e);
    onCheckedChange?.(e.currentTarget.checked);
  };
  const localRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localRef.current) localRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const on = Boolean(checked) || indeterminate;

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
          ref={mergeRefs(ref, localRef)}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className={cn('peer sr-only', className)}
          {...props}
        />
        <span
          className={cn(
            'w-5 h-5 rounded-[5px] inline-flex items-center justify-center flex-shrink-0',
            'border-[1.5px] transition-[background,border-color] duration-150',
            on ? 'bg-primary border-primary' : 'bg-card border-border',
            !on && !disabled && 'peer-hover:border-border peer-hover:bg-secondary',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background'
          )}
        >
          {indeterminate ? (
            <Minus size={12} strokeWidth={2.5} className="text-[color:var(--cta-primary-fg)]" />
          ) : checked ? (
            <Check size={12} strokeWidth={2.5} className="text-[color:var(--cta-primary-fg)]" />
          ) : null}
        </span>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});
