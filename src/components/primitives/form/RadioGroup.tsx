/**
 * RadioGroup — wraps `Radio` items and broadcasts selection via context.
 *
 * Compat with shadcn's RadioGroup / RadioGroupItem API:
 *   <RadioGroup value={v} onValueChange={setV}>
 *     <RadioGroupItem value="to" id="x" />
 *   </RadioGroup>
 *
 * Locked (2a): --primary brown ring + dot when checked; --ring brown focus ring, never silent.
 */

import { createContext, forwardRef, useContext } from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupContextValue {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
}

let anonymousCounter = 0;
const nextName = () => `rg-${Date.now().toString(36)}-${++anonymousCounter}`;

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  { value, defaultValue, onValueChange, disabled = false, name, className, children, ...props },
  ref,
) {
  const resolvedName = name ?? nextName();
  return (
    <RadioGroupContext.Provider value={{ name: resolvedName, value: value ?? defaultValue, onValueChange, disabled }}>
      <div ref={ref} className={cn('grid gap-2', className)} role="radiogroup" {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
});

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  value: string;
}

export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(function RadioGroupItem(
  { value, disabled: disabledProp, className, id, ...props },
  ref,
) {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error('<RadioGroupItem> must be used inside <RadioGroup>');
  }
  const checked = ctx.value === value;
  const disabled = disabledProp ?? ctx.disabled;

  return (
    <label
      htmlFor={id}
      className={cn('relative inline-flex items-center', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
    >
      <input
        ref={ref}
        type="radio"
        id={id}
        name={ctx.name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(e) => { if (e.currentTarget.checked) ctx.onValueChange?.(value); }}
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
          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
        )}
      >
        {checked && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </span>
    </label>
  );
});
