/**
 * TimePicker — time-of-day primitive (HH:MM 24h). Replaces raw <input type="time">.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-05-26-9eon4QqA/project/project/preview/component-time-picker.html
 *
 * Panel auto-portals to body so it escapes overflow-clipping ancestors (e.g. DataTable cells).
 * Inline fallback kicks in inside a Radix Dialog where Portal breaks iOS touch events.
 */

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  formatDisplay,
  parseHHMM,
  timeNowSGT,
  timeRoundToStep,
  TIME_PICKER_PANEL_CLASS,
  type TimePickerFormat,
  type TimePickerSize,
  type TimePickerStep,
} from './TimePicker.helpers';
import { TimePickerPanel } from './TimePicker.panel';
import { TimePickerTrigger } from './TimePicker.trigger';
import { useTimePickerKeys, useTimePickerPortalPos } from './TimePicker.hooks';

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  step?: TimePickerStep;
  format?: TimePickerFormat;
  size?: TimePickerSize;
  error?: boolean;
  'aria-label'?: string;
  triggerTestId?: string;
  nowTestId?: string;
  clearTestId?: string;
  /** `portal` (default outside Dialog) escapes overflow clipping; `inline` stays inside the Dialog so iOS touch events work. */
  position?: 'portal' | 'inline';
}

export function TimePicker({
  value = '',
  onChange,
  placeholder = '--:--',
  disabled = false,
  className,
  step = 5,
  format = '24h',
  size = 'md',
  error = false,
  'aria-label': ariaLabel = 'Pick a time',
  triggerTestId,
  nowTestId,
  clearTestId,
  position,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [focusedCol, setFocusedCol] = useState<'h' | 'm' | 'p'>('h');
  const [insideDialog, setInsideDialog] = useState(false);
  const [portalPos, setPortalPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const portalled = position ? position === 'portal' : !insideDialog;

  const { h, m } = parseHHMM(value);
  const display = formatDisplay(value, format);
  const period: 'AM' | 'PM' | null = h == null ? null : h >= 12 ? 'PM' : 'AM';
  const selectedHourDisplay = format === '12h'
    ? (h == null ? null : (h % 12 === 0 ? 12 : h % 12))
    : h;

  const closeAndRefocus = () => { setOpen(false); triggerRef.current?.focus(); };
  const commit = (hh24: number, mm: number) => {
    onChange?.(`${String(hh24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  };
  const pickHour = (val: number) => {
    const h24 = format === '12h' ? (val % 12) + (period === 'PM' ? 12 : 0) : val;
    commit(h24, m ?? 0);
    closeAndRefocus();
  };
  const pickMinute = (val: number) => { commit(h ?? 0, val); closeAndRefocus(); };
  const pickPeriod = (p: 'AM' | 'PM') => {
    const base = (selectedHourDisplay ?? 9) % 12;
    commit(base + (p === 'PM' ? 12 : 0), m ?? 0);
    closeAndRefocus();
  };
  const handleNow = () => { onChange?.(timeRoundToStep(timeNowSGT(), step)); closeAndRefocus(); };
  const handleClear = () => { onChange?.(''); closeAndRefocus(); };

  useTimePickerKeys({
    open, value, step, format, focusedCol, setFocusedCol,
    wrapRef, panelRef, onClose: closeAndRefocus, onCommit: commit,
  });
  useTimePickerPortalPos(open, portalled, format, wrapRef, setPortalPos);

  const panelWidth = format === '12h' ? 252 : 196;
  const panel = (
    <TimePickerPanel
      value={value} format={format} step={step}
      m={m} period={period} selectedHourDisplay={selectedHourDisplay} focusedCol={focusedCol}
      pickHour={pickHour} pickMinute={pickMinute} pickPeriod={pickPeriod}
      onNow={handleNow} onClear={handleClear}
      nowTestId={nowTestId} clearTestId={clearTestId}
    />
  );

  return (
    <div ref={wrapRef} className={cn('relative inline-block w-full', className)}>
      <TimePickerTrigger
        ref={triggerRef}
        open={open}
        display={display}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        size={size}
        ariaLabel={ariaLabel}
        triggerTestId={triggerTestId}
        onClick={() => {
          if (disabled) return;
          if (wrapRef.current) {
            setInsideDialog(wrapRef.current.closest('[role="dialog"]') !== null);
          }
          setOpen((o) => !o);
        }}
      />

      {open && !portalled && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Pick a time"
          style={{ width: panelWidth, fontFamily: 'var(--font-sans, system-ui)' }}
          className={cn('absolute top-[calc(100%+6px)] left-0 z-50', TIME_PICKER_PANEL_CLASS)}
        >
          {panel}
        </div>
      )}
      {open && portalled && portalPos && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Pick a time"
          style={{
            width: panelWidth,
            top: portalPos.top,
            left: portalPos.left,
            fontFamily: 'var(--font-sans, system-ui)',
          }}
          className={cn('fixed z-[1000]', TIME_PICKER_PANEL_CLASS)}
        >
          {panel}
        </div>,
        document.body,
      )}
    </div>
  );
}
