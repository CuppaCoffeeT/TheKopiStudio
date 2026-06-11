#!/bin/bash
# Phase 1: Track tool failures to a local log file
# Triggered by PostToolUseFailure hook — fires automatically on every failed tool call
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
# Extract error from tool_response (string or object) — first 200 chars
ERROR=$(echo "$INPUT" | jq -r 'if .tool_response | type == "string" then .tool_response elif .tool_response | type == "object" then (.tool_response | tostring) else "no response" end' 2>/dev/null | head -c 200)
# Also grab tool_input for context (e.g. file_path, command)
CONTEXT=$(echo "$INPUT" | jq -r 'if .tool_input.file_path then .tool_input.file_path elif .tool_input.command then (.tool_input.command | .[0:100]) else "" end' 2>/dev/null)
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
LOG="$CLAUDE_PROJECT_DIR/.claude/hooks/failures.log"
echo "${TIMESTAMP} | ${TOOL} | ${CONTEXT} | ${ERROR}" >> "$LOG"
