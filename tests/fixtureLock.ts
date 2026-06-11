/**
 * fixtureLock — cross-process guard for the shared TEST_INVOICE_AUTOMATION fixture.
 *
 * The fixture (tests/global-setup.ts) is a single fixed-UUID set of rows in the
 * shared production DB. `globalTeardown` hard-deletes it. When two `playwright
 * test` invocations overlap (parallel agents, a dev push during a CI run), the
 * first to finish would delete the fixture mid-run for the other — every
 * payment-management spec then fails with FK violations on the missing
 * project/quotation.
 *
 * This guard makes teardown reference-counted: each run registers a PID lock at
 * setup; teardown only performs the destructive delete when no other live run
 * still holds a lock. Fail-safe by design — if the "am I last" check is wrong it
 * errs toward NOT deleting (a lingering fixture is harmless: `globalSetup` is an
 * idempotent upsert that re-seeds it next run).
 *
 * Lock dir lives in the OS tmpdir so concurrent runs on one machine coordinate.
 * Cross-machine CI runs against the same prod DB are a separate, pre-existing
 * concern and out of scope here.
 */
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';

const LOCK_DIR = path.join(os.tmpdir(), 'appbase-e2e-fixture-locks');
const OWN_LOCK = path.join(LOCK_DIR, String(process.pid));

/** Register this Playwright run as an active holder of the shared fixture. */
export function claimFixtureLock(): void {
  mkdirSync(LOCK_DIR, { recursive: true });
  writeFileSync(OWN_LOCK, new Date().toISOString());
}

/**
 * Release this run's lock and report whether it was the LAST live run.
 * Stale locks (dead PIDs) are reaped. Returns true only when no other live
 * run holds the fixture — i.e. it is safe to hard-delete it.
 */
export function releaseFixtureLockAndCheckLast(): boolean {
  try {
    rmSync(OWN_LOCK, { force: true });
  } catch {
    /* already gone — fine */
  }

  let files: string[];
  try {
    files = readdirSync(LOCK_DIR);
  } catch {
    return true; // no lock dir → nobody else
  }

  let liveOthers = 0;
  for (const f of files) {
    const pid = Number(f);
    if (!Number.isInteger(pid) || pid === process.pid) continue;
    try {
      process.kill(pid, 0); // signal 0 = existence probe; throws if gone
      liveOthers++;
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException)?.code === 'EPERM') {
        liveOthers++; // exists, just not ours
      } else {
        rmSync(path.join(LOCK_DIR, f), { force: true }); // ESRCH → stale, reap
      }
    }
  }
  return liveOthers === 0;
}
