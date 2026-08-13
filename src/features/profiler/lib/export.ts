/**
 * Profiler CSV export — port of legacy `dlCSV()` (`public/js/utils.js`).
 *
 * Column ORDER and HEADER strings are frozen to the legacy format (PRD scope
 * cut: "CSV column order/headers unchanged — only comma-escaping fixed").
 * The legacy bug where a comma inside any text field (prospect name,
 * occupation, ...) corrupted the row is fixed by quoting ALL text fields
 * RFC-4180 style; numeric fields stay bare, as legacy emitted them.
 */

import { getLocalDateString } from '@/utils/timezoneUtils';
import { showSuccess } from '@/utils/toastHelper';
import type { ProfilerResult } from '../types';

/** Frozen legacy header row — do not reorder or rename. */
const CSV_HEADER =
  'Date,Advisor,Prospect,Age,Occupation,Meeting,DISC Primary,DISC Secondary,MBTI,Score D,Score I,Score S,Score C,Questions,Observations,Notes';

/**
 * Flat row input for {@link buildCsv}. Works for both a fresh wizard result
 * and a saved `public.results` row.
 *
 * `date` must already be formatted as `yyyy-mm-dd` — produce it with
 * `getLocalDateString` from `@/utils/timezoneUtils` (legacy used a raw
 * `toISOString().slice(0, 10)`).
 */
export interface ProfileCsvRow {
  date: string;
  advisor: string;
  prospect: string;
  age: string;
  occupation: string;
  meeting: string;
  discPrimary: string;
  discSecondary: string;
  mbti: string;
  scoreD: number;
  scoreI: number;
  scoreS: number;
  scoreC: number;
  questions: number;
  observations: number;
  notes: string;
}

/** RFC-4180 quoting: wrap in double quotes, double any embedded quotes. */
function quoteField(value: string): string {
  return '"' + value.replace(/"/g, '""') + '"';
}

/** Builds the two-line CSV (header + one data row) in the frozen legacy format. */
export function buildCsv(row: ProfileCsvRow): string {
  const fields = [
    quoteField(row.date),
    quoteField(row.advisor),
    quoteField(row.prospect),
    quoteField(row.age),
    quoteField(row.occupation),
    quoteField(row.meeting),
    quoteField(row.discPrimary),
    quoteField(row.discSecondary),
    quoteField(row.mbti),
    String(row.scoreD),
    String(row.scoreI),
    String(row.scoreS),
    String(row.scoreC),
    String(row.questions),
    String(row.observations),
    quoteField(row.notes),
  ];
  return CSV_HEADER + '\n' + fields.join(',');
}

/**
 * Triggers a browser download of `csv` as `filename` via a Blob object URL
 * (same mechanism as legacy `dlCSV`; no dependencies).
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Export ONE saved `public.results` row as the legacy CSV. Lives beside
 * `buildCsv` rather than in the detail page because it is column mapping,
 * not page logic. The date is the DOWNLOAD date, not the profiling date —
 * legacy `dlCSV` behaviour, kept deliberately.
 */
export function downloadRowCsv(row: ProfilerResult): void {
  const date = getLocalDateString(new Date());
  const csv = buildCsv({
    date,
    advisor: row.advisor_name,
    prospect: row.prospect_name,
    age: row.age_range ?? '',
    occupation: row.occupation ?? '',
    meeting: row.meeting ?? '',
    discPrimary: row.disc_primary,
    discSecondary: row.disc_secondary,
    mbti: row.mbti,
    scoreD: row.score_d,
    scoreI: row.score_i,
    scoreS: row.score_s,
    scoreC: row.score_c,
    questions: row.questions_answered,
    observations: row.observations_count,
    notes: row.notes ?? '',
  });
  downloadCsv(`profile_${row.prospect_name.replace(/\s+/g, '_')}_${date}.csv`, csv);
  showSuccess('CSV saved');
}
