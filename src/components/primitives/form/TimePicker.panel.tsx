/**
 * TimePicker.panel — popover panel + Hr/Min/AM-PM column sub-components.
 */
import { cn } from '@/lib/utils';
import {
  formatDisplay,
  hourOptions,
  minuteOptions,
  type TimePickerFormat,
} from './TimePicker.helpers';

interface ColumnCellProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  width?: number;
}

function ColumnCell({ label, selected, onClick, width = 44 }: ColumnCellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width, fontFamily: 'var(--font-mono)' }}
      className={cn(
        'h-7 rounded-md flex items-center justify-center text-xs tabular-nums shrink-0 transition-colors',
        'border-none p-0 appearance-none cursor-pointer',
        selected
          ? 'bg-primary text-primary-foreground font-semibold'
          : 'bg-transparent text-muted-foreground hover:bg-secondary',
      )}
    >
      {label}
    </button>
  );
}

interface ColumnSectionProps {
  heading: string;
  focused: boolean;
  divider: 'right' | 'none';
  children: React.ReactNode;
}

function ColumnSection({ heading, focused, divider, children }: ColumnSectionProps) {
  return (
    <div
      className={cn(
        'flex-1 min-w-0 flex flex-col items-center gap-0.5 px-1 py-1.5 max-h-[196px] overflow-y-auto',
        divider === 'right' && 'border-r border-border',
      )}
    >
      <div
        style={{ fontFamily: 'var(--font-pixel)' }}
        className={cn(
          'w-full text-center uppercase tracking-[0.08em] text-[10px] py-1 mb-1.5 border-b transition-colors',
          'text-muted-foreground',
          focused ? 'border-primary' : 'border-border',
        )}
      >
        {heading}
      </div>
      {children}
    </div>
  );
}

export interface TimePickerPanelProps {
  value: string;
  format: TimePickerFormat;
  step: number;
  m: number | null;
  period: 'AM' | 'PM' | null;
  selectedHourDisplay: number | null;
  focusedCol: 'h' | 'm' | 'p';
  pickHour: (val: number) => void;
  pickMinute: (val: number) => void;
  pickPeriod: (p: 'AM' | 'PM') => void;
  onNow: () => void;
  onClear: () => void;
  nowTestId?: string;
  clearTestId?: string;
}

export function TimePickerPanel({
  value, format, step, m, period, selectedHourDisplay, focusedCol,
  pickHour, pickMinute, pickPeriod, onNow, onClear, nowTestId, clearTestId,
}: TimePickerPanelProps) {
  const hours = hourOptions(format);
  const minutes = minuteOptions(step);
  return (
    <>
      <div className="flex p-1.5 pb-0">
        <ColumnSection heading="Hr" focused={focusedCol === 'h'} divider="right">
          {hours.map((hr) => (
            <ColumnCell key={hr} label={String(hr).padStart(2, '0')} selected={selectedHourDisplay === hr} onClick={() => pickHour(hr)} />
          ))}
        </ColumnSection>
        <ColumnSection heading="Min" focused={focusedCol === 'm'} divider={format === '12h' ? 'right' : 'none'}>
          {minutes.map((mn) => (
            <ColumnCell key={mn} label={String(mn).padStart(2, '0')} selected={m === mn} onClick={() => pickMinute(mn)} />
          ))}
        </ColumnSection>
        {format === '12h' && (
          <ColumnSection heading="AM/PM" focused={focusedCol === 'p'} divider="none">
            {(['AM', 'PM'] as const).map((p) => (
              <ColumnCell key={p} label={p} selected={period === p} onClick={() => pickPeriod(p)} width={48} />
            ))}
          </ColumnSection>
        )}
      </div>
      <div className={cn('flex items-center gap-2 px-3 py-2.5 border-t', 'border-border', 'bg-secondary')}>
        <button
          type="button"
          onClick={onNow}
          data-testid={nowTestId}
          style={{ fontFamily: 'var(--font-mono)' }}
          className={cn(
            'h-[26px] px-2.5 rounded-md border text-[11px] font-semibold cursor-pointer',
            'border-border',
            'text-primary',
            'bg-transparent hover:bg-primary/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          Now
        </button>
        <button
          type="button"
          onClick={onClear}
          data-testid={clearTestId}
          style={{ fontFamily: 'var(--font-mono)' }}
          className={cn(
            'h-[26px] px-2.5 rounded-md border text-[11px] cursor-pointer',
            'border-border',
            'text-muted-foreground',
            'bg-transparent hover:bg-secondary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          Clear
        </button>
        <div className="flex-1" />
        <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[11px] text-muted-foreground tabular-nums">
          {value ? formatDisplay(value, format) : '--:--'}
        </span>
      </div>
    </>
  );
}
