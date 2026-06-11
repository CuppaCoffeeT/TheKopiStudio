#!/bin/bash
# =============================================================================
# manual-run-wrapper.sh — Run claude -p and track the run in agent_runs
#
# Wraps any manual/ad-hoc Claude Code invocation so it appears in the
# Agent Dashboard with run_type='manual'. Reuses parse-nightly-log.sh
# for all parsing and Supabase insertion.
#
# Usage:
#   ./manual-run-wrapper.sh "<prompt>" [agent_name] [workspace_dir]
#
# Arguments:
#   prompt         - The prompt to send to claude -p (required)
#   agent_name     - Agent slug: agent-j, health-checker, etc. (default: agent-j)
#   workspace_dir  - Working directory for claude (default: current dir)
#
# Examples:
#   # Simple manual run as Agent J
#   ~/.claude/scripts/manual-run-wrapper.sh "Check if there are any TypeScript errors"
#
#   # Run as a specific agent in its workspace
#   ~/.claude/scripts/manual-run-wrapper.sh "Run health checks" health-checker ~/appbase-health-checker
#
#   # Run AppBase Advisor with a question
#   ~/.claude/scripts/manual-run-wrapper.sh "How does the people normalization work?" appbase-advisor ~/appbase-advisor
#
# Environment:
#   SUPABASE_URL              - Supabase project URL (inherited by parse-nightly-log.sh)
#   SUPABASE_SERVICE_ROLE_KEY - Service role key (inherited by parse-nightly-log.sh)
#
# Output:
#   Claude's response is printed to stdout (and also saved to log).
#   The inserted agent_run UUID is printed to stderr.
# =============================================================================

set -euo pipefail

PROMPT="${1:?Usage: manual-run-wrapper.sh \"<prompt>\" [agent_name] [workspace_dir]}"
AGENT_NAME="${2:-agent-j}"
WORKSPACE_DIR="${3:-.}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARSE_SCRIPT="${SCRIPT_DIR}/parse-nightly-log.sh"

if [ ! -f "$PARSE_SCRIPT" ]; then
  echo "Error: parse-nightly-log.sh not found at $PARSE_SCRIPT" >&2
  exit 1
fi

# Generate unique log file
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
LOG_FILE="/tmp/${AGENT_NAME}-manual-${TIMESTAMP}.log"

echo "=== manual-run-wrapper.sh ===" >&2
echo "Agent: $AGENT_NAME" >&2
echo "Workspace: $WORKSPACE_DIR" >&2
echo "Log file: $LOG_FILE" >&2
echo "Prompt: ${PROMPT:0:100}..." >&2

# Save prompt to sidecar file (for potential future prompt_input tracking)
echo "$PROMPT" > "${LOG_FILE}.prompt"

# Run claude and capture output
cd "$WORKSPACE_DIR"
if /opt/homebrew/bin/claude -p "$PROMPT" 2>&1 | tee "$LOG_FILE"; then
  echo "" >&2
  echo "=== Claude finished, parsing run ===" >&2
else
  echo "" >&2
  echo "=== Claude exited with error, parsing run anyway ===" >&2
fi

# Parse the log and insert into agent_runs
RUN_ID=$("$PARSE_SCRIPT" "$LOG_FILE" manual manual "$AGENT_NAME")

if [ -n "$RUN_ID" ]; then
  echo "Tracked as agent_run: $RUN_ID" >&2

  # Patch prompt_input and input_chars onto the inserted row
  PROMPT_CHARS=${#PROMPT}
  PROMPT_ESCAPED=$(python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" <<< "$PROMPT")

  curl -s -o /dev/null -w "" \
    -X PATCH "${SUPABASE_URL:-https://your-project-ref.supabase.co}/rest/v1/agent_runs?id=eq.${RUN_ID}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"prompt_input\": ${PROMPT_ESCAPED}, \"input_chars\": ${PROMPT_CHARS}}" 2>/dev/null || true

  echo "Patched prompt_input (${PROMPT_CHARS} chars)" >&2
fi

# Cleanup prompt sidecar
rm -f "${LOG_FILE}.prompt"

echo "=== Done ===" >&2
