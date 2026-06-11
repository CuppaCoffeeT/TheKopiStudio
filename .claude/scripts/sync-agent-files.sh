#!/bin/bash
# =============================================================================
# sync-agent-files.sh — Sync agent personality files to Supabase
#
# Reads personality files (SOUL.md, IDENTITY.md, USER.md) and knowledge files
# (MEMORY.md) from each agent's OpenClaw directory and upserts them into the
# agent_files table.
#
# Usage:
#   ./sync-agent-files.sh
#
# Environment:
#   SUPABASE_URL              - Supabase project URL
#   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
#
# Schedule: Run via launchd/cron every 5 minutes, or after agent config edits.
# =============================================================================

set -euo pipefail

# ---- Config ----
SUPABASE_URL="${SUPABASE_URL:-https://your-project-ref.supabase.co}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY must be set}"
AGENTS_DIR="${HOME}/.openclaw/agents"

# Agent directory → slug mapping
declare -A SLUG_MAP=(
  ["main"]="agent-j"
  ["health-checker"]="health-checker"
  ["docs-monitor"]="docs-monitor"
  ["appbase-advisor"]="appbase-advisor"
  ["email-agent"]="email-agent"
)

FILES=("SOUL.md" "IDENTITY.md" "USER.md" "MEMORY.md")

# ---- Counters ----
synced=0
skipped=0
failed=0

echo "[sync-agent-files] Starting at $(date '+%Y-%m-%d %H:%M:%S %Z')"

for agent_dir in "${!SLUG_MAP[@]}"; do
  slug="${SLUG_MAP[$agent_dir]}"
  dir="${AGENTS_DIR}/${agent_dir}/agent"

  if [ ! -d "$dir" ]; then
    echo "  SKIP ${slug}: directory not found at ${dir}"
    skipped=$((skipped + 1))
    continue
  fi

  for file_name in "${FILES[@]}"; do
    file_path="${dir}/${file_name}"

    if [ ! -f "$file_path" ]; then
      echo "  SKIP ${slug}/${file_name}: file not found"
      skipped=$((skipped + 1))
      continue
    fi

    # Read file content and escape for JSON
    content=$(python3 -c "
import json, sys
with open(sys.argv[1], 'r') as f:
    print(json.dumps(f.read()))
" "$file_path")

    # Build JSON payload
    payload=$(cat <<ENDJSON
{
  "agent_slug": "${slug}",
  "file_name": "${file_name}",
  "content": ${content},
  "updated_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
}
ENDJSON
)

    # Upsert to Supabase
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST "${SUPABASE_URL}/rest/v1/agent_files" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      -H "Content-Type: application/json" \
      -H "Prefer: resolution=merge-duplicates,return=minimal" \
      -d "$payload")

    if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
      synced=$((synced + 1))
    else
      echo "  FAIL ${slug}/${file_name}: HTTP ${HTTP_CODE}"
      failed=$((failed + 1))
    fi
  done
done

echo "[sync-agent-files] Done: ${synced} synced, ${skipped} skipped, ${failed} failed"
