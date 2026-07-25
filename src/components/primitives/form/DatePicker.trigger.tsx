/**
 * DatePicker.trigger — trigger for the DatePicker primitive.
 *
 * Two shapes:
 *   - default (range mode) → display-only `<button>` that opens the calendar.
 *   - `editable` (single mode) → typeable `<input>` (dd/mm/yyyy) + clickable
 *     calendar icon. Users can type numbers OR click to pick. Typing is
 *     parsed/committed by the parent on blur/Enter (see DatePicker.tsx).
 */
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DatePickerSize } from './DatePicker.helpers';

interface DatePickerTriggerProps {
  open: boolean;
  displayText: string;
  placeholder: string;
  disabled: boolean;
  error: boolean;
  size: DatePickerSize;
  triggerTestId?: string;
  onClick: () => void;
  /** Single mode → render a typeable input instead of a display-only button. */
  editable?: boolean;
  /** Value shown in the editable input (typed text while focused, else display). */
  inputValue?: string;
  onInputChange?: (s: string) => void;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function DatePickerTrigger({
  open, displayText, placeholder, disabled, error, size, triggerTestId, onClick,
  editable, inputValue, onInputChange, onInputFocus, onInputBlur, onInputKeyDown,
}: DatePickerTriggerProps) {
  const heightCls =
    size === 'lg' ? 'h-12 text-[14px]' : size === 'sm' ? 'h-7 text-xs' : 'h-10 text-[13px]';
  const padCls = size === 'sm' ? 'px-2' : 'px-3';
  // Touch keyboard zoom guard on the larger sizes (dense sm stays compact for desktop tables).
  const touchTextCls = size === 'sm' ? '' : 'pointer-coarse:text-[16px]';

  const frameCls = cn(
    'w-full flex items-center gap-2 rounded-lg border tabular-nums',
    padCls,
    heightCls,
    error ? 'border-destructive' : 'border-border',
    !disabled && !error && 'hover:border-border',
    // 2a: brown ring at 50% — the 15% alpha it replaced composited to 1.2:1 and read as no ring at all.
    open && !error && 'border-ring ring-[3px] ring-ring/50',
    disabled ? 'bg-secondary opacity-80 cursor-not-allowed' : 'bg-card',
    'transition-[box-shadow,border-color] duration-150',
  );

  if (editable) {
    return (
      <div
        className={cn(
          frameCls,
          !disabled && 'cursor-text',
          // The inner input paints no outline of its own, so the frame carries the focus cue.
          !error && 'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={onClick}
          aria-label="Open calendar"
          className={cn('flex-shrink-0 inline-flex items-center', !disabled && 'cursor-pointer')}
        >
          <Calendar size={14} className="text-muted-foreground" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={inputValue ?? ''}
          placeholder={placeholder}
          data-testid={triggerTestId}
          onChange={(e) => onInputChange?.(e.target.value)}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          onKeyDown={onInputKeyDown}
          className={cn(
            'flex-1 min-w-0 bg-transparent border-0 p-0 outline-none',
            touchTextCls,
            'text-foreground placeholder:text-muted-foreground',
            disabled && 'cursor-not-allowed',
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid={triggerTestId}
      className={cn(
        frameCls,
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {!displayText && (
        <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
      )}
      <span
        className={cn(
          'flex-1 text-left truncate',
          displayText ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {displayText || placeholder}
      </span>
    </button>
  );
}
