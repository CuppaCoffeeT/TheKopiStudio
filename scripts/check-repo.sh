#!/usr/bin/env bash
# check-repo.sh — audit the codebase against the 2026-05-31 AppBase refactor standard.
# Highlights ANY deviation from the post-refactor target state. Read-only.
# Usage:  npm run check:repo            (fast checks)
#         npm run check:repo -- --full  (also runs build — slow)
# Exit code = number of BLOCKER deviations (0 = clean).
set -uo pipefail
cd "$(dirname "$0")/.." || exit 99

FULL=0; [ "${1:-}" = "--full" ] && FULL=1
BLOCKERS=0; WARNS=0
red()  { printf "\033[31m%s\033[0m\n" "$1"; }
grn()  { printf "\033[32m%s\033[0m\n" "$1"; }
yel()  { printf "\033[33m%s\033[0m\n" "$1"; }
hdr()  { printf "\n\033[1m== %s ==\033[0m\n" "$1"; }
ok()   { grn "  ✅ $1"; }
bad()  { red "  ❌ $1"; BLOCKERS=$((BLOCKERS+1)); }
warn() { yel "  ⚠️  $1"; WARNS=$((WARNS+1)); }

echo "AppBase — check-repo (2026-05-31 refactor standard)"
echo "Branch: $(git branch --show-current 2>/dev/null) · $(date '+%Y-%m-%d %H:%M')"

# 1 — src/components = {primitives, ui, shared} only, zero loose root files
hdr "1. src/components/ structure"
STRAY_DIRS=$(find src/components -mindepth 1 -maxdepth 1 -type d ! -name primitives ! -name ui ! -name shared 2>/dev/null)
LOOSE=$(find src/components -maxdepth 1 -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null)
[ -z "$STRAY_DIRS" ] && ok "only primitives/ ui/ shared/ subfolders" || { bad "stray domain folder(s):"; echo "$STRAY_DIRS" | sed 's/^/        /'; }
[ -z "$LOOSE" ] && ok "no loose root .ts/.tsx files" || { bad "loose root file(s) (must be in primitives/ui/shared or a feature):"; echo "$LOOSE" | sed 's/^/        /'; }

# 2 — drained residue folders must NOT exist
hdr "2. Drained residue folders"
for d in src/types src/constants src/styles src/config src/services_legacy; do
  if [ -d "$d" ]; then
    n=$(find "$d" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) | wc -l | tr -d ' ')
    [ "$n" = "0" ] && warn "$d/ exists but empty (rmdir it)" || bad "$d/ still has $n file(s) — should be drained to lib/features"
  fi
done
[ ! -d src/types ] && [ ! -d src/constants ] && [ ! -d src/styles ] && ok "src/{types,constants,styles} removed"

# 3 — src/pages thin (residual route shells only)
hdr "3. src/pages/ (thin route shells only)"
PAGES=$(find src/pages -maxdepth 1 -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null | sed 's#.*/##' | sort | tr '\n' ' ')
EXPECTED="NotFound.tsx RouteError.tsx"
EXTRA=$(comm -23 <(find src/pages -maxdepth 1 -type f \( -name '*.tsx' \) 2>/dev/null | sed 's#.*/##' | sort) <(printf 'NotFound.tsx\nRouteError.tsx\n') )
[ -z "$EXTRA" ] && ok "only thin shells: $PAGES" || { warn "non-canonical src/pages file(s) (expect only NotFound, RouteError):"; echo "$EXTRA" | sed 's/^/        /'; }

# 4 — src/hooks must never import from src/features (de-cycle invariant)
hdr "4. src/hooks/ de-cycle invariant"
HOOKFEAT=$(grep -rln "from ['\"]@/features/" src/hooks 2>/dev/null)
[ -z "$HOOKFEAT" ] && ok "no src/hooks file imports @/features/* (root hooks stay global)" || { bad "hook(s) importing @/features (mis-placed → move into the feature):"; echo "$HOOKFEAT" | sed 's/^/        /'; }
echo "     (info) src/hooks root files: $(find src/hooks -maxdepth 1 -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l | tr -d ' ')"

# 5 — dependency-cruiser drift (cross-feature / circular / pages→features / no-stray-domain-components)
hdr "5. Architecture drift (dependency-cruiser)"
if npm run --silent drift:check >/tmp/cs_drift.txt 2>&1; then ok "drift:check clean (0 violations)"; else bad "drift:check FAILED — see below"; tail -8 /tmp/cs_drift.txt | sed 's/^/        /'; fi

# 6 — LOC ratchet (no file pushed back over >200 LOC net-new; no new god-file)
hdr "6. LOC ratchet (<=200 LOC target)"
if npm run --silent loc:check >/tmp/cs_loc.txt 2>&1; then ok "$(grep -oE 'LOC ratchet:.*' /tmp/cs_loc.txt | head -1)"; else bad "loc:check FAILED — a file regressed over the >200 LOC line"; tail -8 /tmp/cs_loc.txt | sed 's/^/        /'; fi
GOD=$(find src \( -name '*.ts' -o -name '*.tsx' \) | grep -vE "node_modules|integrations/supabase/types.ts|\.d\.ts$" | xargs wc -l 2>/dev/null | awk '$1>1000 && $2!="total"{print $1" "$2}')
[ -z "$GOD" ] && ok "no >1000-LOC god-files (generated supabase types excluded)" || { warn ">1000-LOC file(s):"; echo "$GOD" | sed 's/^/        /'; }

# 8 — every feature folder has a CONTEXT.md
hdr "8. Feature CONTEXT.md presence"
MISSING=""
for f in src/features/*/; do [ -f "${f}CONTEXT.md" ] || MISSING="$MISSING ${f}"; done
[ -z "$MISSING" ] && ok "every src/features/<x>/ has CONTEXT.md" || { warn "feature(s) missing CONTEXT.md:"; echo "$MISSING" | tr ' ' '\n' | grep . | sed 's/^/        /'; }

# 9 — token budget for the ALWAYS-LOADED entry/router layer (CLAUDE.md + workspace/category routers).
#     Per-feature CONTEXT.md are the TOKEN_BUDGET-exempt per-feature inventory pattern → audited by /context-check, not here.
hdr "9. Token budget (entry + workspace/category routers)"
CLAUDEC=$(wc -c < CLAUDE.md 2>/dev/null | tr -d ' '); [ "${CLAUDEC:-0}" -le 3200 ] && ok "CLAUDE.md ${CLAUDEC}c (<=3200c)" || warn "CLAUDE.md ${CLAUDEC}c OVER 3200c ceiling — extract detail to docs/99-meta/ (TOKEN_BUDGET.md)"
ROUTERS="src/CONTEXT.md docs/CONTEXT.md supabase/CONTEXT.md .claude/CONTEXT.md $(ls docs/*/CONTEXT.md 2>/dev/null)"
ROVER=$(for c in $ROUTERS; do [ -f "$c" ] || continue; n=$(wc -c <"$c"|tr -d ' '); [ "$n" -gt 2400 ] && echo "$n $c"; done | sort -rn)
[ -z "$ROVER" ] && ok "workspace + category routers within 2400c" || { warn "workspace/category router(s) over 2400c (route-only — extract detail to a sibling guide):"; echo "$ROVER" | sed 's/^/        /'; }
echo "     (info) per-feature CONTEXT.md use the sanctioned inventory pattern; audit with /context-check"

# 10 — dead code (knip unused files trend)
hdr "10. Dead code (knip unused files)"
if command -v knip >/dev/null 2>&1 || [ -f node_modules/.bin/knip ]; then
  UF=$(npm run --silent knip 2>/dev/null | grep -iE '^Unused files \(' | grep -oE '[0-9]+' | head -1)
  [ -n "$UF" ] && { [ "$UF" -le 5 ] && ok "knip unused files: $UF (clean — known false-positive keeps)" || warn "knip unused files: $UF (was 2 at 2026-05-31 baseline; investigate new dead files)"; } || warn "knip ran but count unparsed"
else warn "knip not available — skipped"; fi

# 11 — tsc truth gate
hdr "11. TypeScript"
if npx tsc --noEmit >/tmp/cs_tsc.txt 2>&1; then ok "tsc --noEmit → 0 errors"; else bad "tsc errors:"; tail -6 /tmp/cs_tsc.txt | sed 's/^/        /'; fi

# 12 — build (optional, --full)
if [ "$FULL" = "1" ]; then
  hdr "12. Production build (--full)"
  if npm run --silent build >/tmp/cs_build.txt 2>&1; then ok "vite build passed"; else bad "build FAILED"; tail -8 /tmp/cs_build.txt | sed 's/^/        /'; fi
fi

# Summary
hdr "SUMMARY"
if [ "$BLOCKERS" = "0" ] && [ "$WARNS" = "0" ]; then grn "✅ CLEAN — no deviations from the 2026-05-31 standard.";
elif [ "$BLOCKERS" = "0" ]; then yel "⚠️  $WARNS warning(s), 0 blockers — non-blocking drift to tidy.";
else red "❌ $BLOCKERS blocker(s) + $WARNS warning(s) — deviations require a fix pass."; fi
echo "Per-module depth: /check-module <feature>.  Standard: docs/ONBOARDING.md"
exit "$BLOCKERS"
