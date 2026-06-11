---
paths:
  - .claude/scripts/**
  - scripts/**
---

# Rule: Shell Scripting Standards

## Summary

Shell scripts targeting Mac Mini (bash 3.2) must avoid bash 4+ features. Remote script execution should use file transfer (scp) instead of inline heredocs with complex escaping. Always check CLI tool help before guessing subcommands.

## Detailed Patterns

### Bash Version Compatibility

```bash
# ❌ FORBIDDEN on Mac Mini (bash 3.2)
declare -A my_map  # associative arrays require bash 4+

# ✅ Use indexed arrays or separate variables
SLUGS="agent-j health-checker docs-monitor"
```

### Remote Script Execution

```bash
# ❌ AVOID — complex escaping mangles shell variables
ssh mini 'python3 << "EOF"
import subprocess
date = "$DATE"  # shell var gets mangled
EOF'

# ✅ Write locally, transfer, execute
cat > /tmp/script.py << 'EOF'
import subprocess
import sys
date = sys.argv[1]
EOF
scp /tmp/script.py mini:/tmp/
ssh mini "python3 /tmp/script.py $DATE"
```

### CLI Tool Discovery

```bash
# ❌ AVOID — guessing subcommands
openclaw send --agent foo    # "send" doesn't exist
openclaw restart             # "restart" doesn't exist

# ✅ Check help first
openclaw --help
openclaw agent --help
```

## Known Patterns


### Pattern: Bash 4+ features, SSH heredoc escaping, and CLI command guessing
**Occurrences**: 5 (as of 2026-03-26)
**Files affected**: .claude/scripts/sync-agent-files.sh, .claude/scripts/nightly-health-check.sh, ~/.openclaw/openclaw.json
**Problem**: (1) Used `declare -A` associative arrays in scripts running on Mac Mini bash 3.2 — caused unbound variable errors. (2) Attempted complex Python heredocs via SSH with shell variable interpolation — escaping mangled variables across multiple retries. (3) Guessed CLI subcommands (`openclaw send`, `openclaw restart`) that don't exist, and guessed config file extensions (`.yaml`, `.toml`) instead of checking. (4) Looked for OpenClaw config at wrong paths before finding `~/.openclaw/openclaw.json`.
**Solution**: (1) Always check target bash version — Mac Mini is bash 3.2, no associative arrays. (2) For multi-line remote scripts, write to local temp file and scp. (3) Run `<tool> --help` before guessing subcommands. (4) OpenClaw config is always `~/.openclaw/openclaw.json` — use `ls` to verify paths instead of guessing extensions.

## References

- CLAUDE.md naming conventions for scripts
- Related: [code-hygiene.md](./code-hygiene.md) — general code quality checks
