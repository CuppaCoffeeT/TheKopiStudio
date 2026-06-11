#!/usr/bin/env node
// Lightweight smoke test for new W12.04 wrappers added to src/utils/timezoneUtils.ts.
// Re-implements the same native-Intl logic the wrappers use so it can run under
// plain Node (no tsx/vitest in this repo). Any drift between this script and the
// wrapper means one of them is wrong — run after touching timezoneUtils.ts.

const SG = 'Asia/Singapore';
let fail = 0;
const check = (label, got, want) => {
  if (got === want) {
    console.log(`  PASS  ${label}`);
  } else {
    console.error(`  FAIL  ${label}\n        got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`);
    fail++;
  }
};

const parseFromDatabase = (v) => (typeof v === 'string' ? new Date(v) : v);

const formatDisplayDateTimeSlashed = (v) => {
  const d = typeof v === 'string' ? new Date(v) : v;
  if (!d || isNaN(d.getTime())) return '';
  const dp = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: SG });
  const tp = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: SG });
  return `${dp} ${tp}`;
};

const formatDisplayDateLong = (v) => {
  const d = typeof v === 'string' ? new Date(v) : v;
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: SG });
};

const formatMonthYear = (v) => {
  const d = typeof v === 'string' ? new Date(v) : v;
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: SG });
};

console.log('\nparseFromDatabase semantics');
{
  const utc = '2026-04-19T16:00:00Z';
  const parsed = parseFromDatabase(utc);
  check('round-trips UTC ISO to Date', parsed.toISOString(), '2026-04-19T16:00:00.000Z');
  check('SGT render of 16:00Z is 00:00 next day', formatDisplayDateTimeSlashed(parsed), '20/04/2026 00:00');
}

console.log('\nformatDisplayDateLong');
check('16:00Z on 2026-04-19 → "20 Apr 2026" SGT', formatDisplayDateLong('2026-04-19T16:00:00Z'), '20 Apr 2026');
check('noon SGT (04:00Z) same SGT day', formatDisplayDateLong('2026-04-19T04:00:00Z'), '19 Apr 2026');

console.log('\nformatMonthYear');
check('April 2026 rollover', formatMonthYear('2026-04-19T16:00:00Z'), 'April 2026');
check('Early Apr', formatMonthYear('2026-04-01T00:00:00Z'), 'April 2026');

console.log('\nformatDisplayDateTimeSlashed edge cases');
check('empty string → ""', formatDisplayDateTimeSlashed(''), '');
check('invalid Date → ""', formatDisplayDateTimeSlashed(new Date('bogus')), '');

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
