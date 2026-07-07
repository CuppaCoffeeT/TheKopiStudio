/**
 * TimePicker.trigger — clock-icon trigger button for the TimePicker primitive.
 */
import { forwardRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimePickerSize } from './TimePicker.helpers';

export interface TimePickerTriggerProps {
  open: boolean;
  display: string;
  placeholder: string;
  disabled: boolean;
  error: boolean;
  size: TimePickerSize;
  ariaLabel: string;
  triggerTestId?: string;
  onClick: () => void;
}

export const TimePickerTrigger = forwardRef<HTMLButtonElement, TimePickerTriggerProps>(
  function TimePickerTrigger(
    { open, display, placeholder, disabled, error, size, ariaLabel, triggerTestId, onClick },
    ref,
  ) {
    const heightClass = size === 'lg' ? 'h-12' : size === 'sm' ? 'h-8' : 'h-10';
    const textSizeClass = size === 'lg' ? 'text-sm' : 'text-[13px]';
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={onClick}
        data-testid={triggerTestId}
        style={{ fontFamily: 'var(--font-mono)' }}
        className={cn(
          'w-full flex items-center gap-2 px-3 rounded-lg border bg-card',
          heightClass,
          textSizeClass,
          'tabular-nums text-left appearance-none transition-[box-shadow,border-color,background] duration-150',
          error || open ? 'border-red-700 dark:border-red-400' : 'border-border',
          open && 'ring-[3px] ring-ring/15',
          'hover:border-border',
          'active:bg-secondary',
          'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/15',
          'disabled:bg-secondary disabled:cursor-not-allowed disabled:opacity-80',
          display ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <Clock className={cn(size === 'lg' ? 'h-4 w-4' : size === 'sm' ? 'h-3 w-3' : 'h-[14px] w-[14px]', 'shrink-0 text-muted-foreground')} />
        <span className="flex-1 truncate text-center tracking-[0.04em]">{display || placeholder}</span>
        <span aria-hidden className={cn(size === 'lg' ? 'w-4' : size === 'sm' ? 'w-3' : 'w-[14px]', 'shrink-0')} />
      </button>
    );
  },
);
