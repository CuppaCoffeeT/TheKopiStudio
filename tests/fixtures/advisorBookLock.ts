/**
 * advisorBookLock — cross-worker mutex for the e2e ADVISOR's live CRM book
 * (clients / policies / interactions / bank_balance_history).
 *
 * THE PATH IS THE CONTRACT: `<tmpdir>/crm-e2e-advisor-book.lock` is the same
 * lock directory that tests/workflows/crm/clients-advisor.spec.ts creates
 * inline (its journey's dashboard-KPI baseline+delta assertions read the WHOLE
 * advisor book, so any other spec that inserts into or deletes from that book
 * mid-journey breaks its math). Any spec writing rows owned by the e2e advisor
 * must hold this lock for the duration of each write window.
 *
 * Same mkdir-based pattern as profiler account-settings.spec.ts: `mkdirSync`
 * is atomic on a single host — exactly the scope of one suite invocation's
 * workers (see tests/lessons.md 2026-06-01 fixtureLock cross-host entry for
 * why this does NOT lock across machines).
 */

import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const ADVISOR_BOOK_LOCK = join(tmpdir(), 'crm-e2e-advisor-book.lock');

function bookLockIsStale(): boolean {
  try {
    const pid = Number(readFileSync(join(ADVISOR_BOOK_LOCK, 'pid'), 'utf8'));
    process.kill(pid, 0); // throws if the holder process is gone
    return false;
  } catch {
    // No live holder — but a JUST-created lock may not have written its pid
    // yet. Only treat it as stale once it has had ample time to do so.
    try {
      return Date.now() - statSync(ADVISOR_BOOK_LOCK).mtimeMs > 10_000;
    } catch {
      return false; // lock dir vanished — the next mkdir attempt resolves it
    }
  }
}

/**
 * Block until this worker owns the advisor-book lock (or `timeoutMs` elapses).
 * `owner` labels the timeout error so a stuck run names the waiting spec.
 */
export async function acquireAdvisorBookLock(timeoutMs: number, owner: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      mkdirSync(ADVISOR_BOOK_LOCK); // atomic — exactly one worker wins
      writeFileSync(join(ADVISOR_BOOK_LOCK, 'pid'), String(process.pid));
      return;
    } catch {
      if (bookLockIsStale()) {
        rmSync(ADVISOR_BOOK_LOCK, { recursive: true, force: true });
        continue;
      }
      if (Date.now() > deadline) {
        throw new Error(
          `[${owner}] timed out waiting for the advisor-book lock (${ADVISOR_BOOK_LOCK}) — ` +
            'is another worker/invocation stuck mid-journey?',
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

export function releaseAdvisorBookLock(): void {
  rmSync(ADVISOR_BOOK_LOCK, { recursive: true, force: true });
}
