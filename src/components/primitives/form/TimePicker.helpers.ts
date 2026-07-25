/**
 * TimePicker.helpers — pure utilities + types for TimePicker (no React).
 */

import { cn } from '@/lib/utils';

export const TIME_PICKER_PANEL_CLASS = cn(
  'overflow-hidden rounded-[10px]',
  'border border-border',
  'bg-card',
  // Warm-ink float — 2a tints its shadows with the ink (#3A2E24), never black.
  'shadow-[0_12px_40px_rgb(58_46_36_/_0.12)]',
);

export type TimePickerSize = 'sm' | 'md' | 'lg';
export type TimePickerFormat = '12h' | '24h';
export type TimePickerStep = 1 | 5 | 15 | 30 | 60;

export function timeNowSGT(): string {
  const now = new Date();
  const sgMs = now.getTime() + (now.getTimezoneOffset() + 8 * 60) * 60_000;
  const d = new Date(sgMs);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function timeRoundToStep(hhmm: string, step: number = 5): string {
  if (!hhmm) return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const total = h * 60 + m;
  const rounded = Math.round(total / step) * step;
  const safe = Math.min(23 * 60 + 59, Math.max(0, rounded));
  const hh = String(Math.floor(safe / 60)).padStart(2, '0');
  const mm = String(safe % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function parseHHMM(value: string): { h: number | null; m: number | null } {
  if (!value) return { h: null, m: null };
  const [h, m] = value.split(':').map(Number);
  return { h: Number.isFinite(h) ? h : null, m: Number.isFinite(m) ? m : null };
}

export function formatDisplay(value: string, format: TimePickerFormat = '24h'): string {
  if (!value) return '';
  const { h, m } = parseHHMM(value);
  if (h == null || m == null) return '';
  const mm = String(m).padStart(2, '0');
  if (format === '12h') {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${mm} ${period}`;
  }
  return `${String(h).padStart(2, '0')}:${mm}`;
}

export function hourOptions(format: TimePickerFormat): number[] {
  if (format === '12h') return Array.from({ length: 12 }, (_, i) => i + 1);
  return Array.from({ length: 24 }, (_, i) => i);
}

export function minuteOptions(step: number): number[] {
  const out: number[] = [];
  for (let m = 0; m < 60; m += step) out.push(m);
  return out;
}
