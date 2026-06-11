# Tests · decisions

Append-only. Newest at the bottom. Format authority: [DECISIONS_LESSONS_PATTERN.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/DECISIONS_LESSONS_PATTERN.md).

Created: 2026-06-01
Last Updated: 2026-06-01

---

## 2026-06-01 — Fast push-gate tag = `@pushgate`, not `@smoke`
**Decision**: Tag the sub-minute pre-push gate specs `@pushgate`; leave `@smoke` for the existing heavy on-demand journeys.
**Why**: `@smoke` was already live — `tests/prod-recovery-journey.spec.ts` (a ~4-min DB-writing recovery walk, documented in-file) owns it. Reusing `@smoke` for the gate would have pulled that 4-min journey into every push. A distinct tag keeps the gate fast and the journey on-demand.
**Impact**: The push hook greps `@pushgate`; the recovery journey keeps `@smoke`. Reversible — a tag rename, no test logic depends on the name. See lessons 2026-06-01 "`@smoke` was already taken".

## 2026-06-01 — Self-heal is OFF by default (SELF_HEAL=0)
**Decision**: `comprehensive-run.sh` defaults `SELF_HEAL=0`; auto-branch/commit/merge/push only happens when the caller explicitly opts in with `SELF_HEAL=1`.
**Why**: A hand-run on the laptop or Mini (for diagnosis) must never mutate git — no auto-branch, commit, merge, or push behind the dev's back. The nightly cron is the only caller that opts in (`SELF_HEAL=1`); every interactive run stays read-only on the repo.
**Impact**: `comprehensive-run.sh` is safe to run by hand for diagnosis — it runs the suite and reports, nothing more, unless `SELF_HEAL=1` is set. The nightly cron job carries the opt-in.

## 2026-06-01 — Comprehensive + self-heal runs on the Mac Mini cron-manager, NOT GitHub Actions
**Decision**: The heavy comprehensive run + self-heal lives on the Mac Mini's cron-manager (launchd). GitHub Actions / `seatbelt.yml` stays a thin push-smoke gate only; no self-hosted runner.
**Why**: The comprehensive run needs the real NAS over SMB (GitHub-hosted CI has no SMB mount, so NAS specs skip) and the Mini's keychain-authed `claude` for self-heal. It also writes to the shared prod DB, so it can't tolerate GitHub's parallel-worker prod-DB contention. The Mini has the mount, the keychain, and a controllable single-run window.
**Impact**: `seatbelt.yml` stays a lightweight push-smoke gate; no self-hosted runner is added. Heavy + self-healing runs are owned by the Mini cron. Anyone debugging the heavy run does it on the Mini (or laptop) with the real NAS mounted, not in CI.
