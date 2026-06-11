# Rule: Continuous Hygiene (MANDATORY)

## Summary

Every time you touch a file, apply four checks before finishing: check for inconsistencies with related files or CLAUDE.md rules, check for redundant logic duplicated elsewhere, check for clarity (would an AI reading this for the first time know what to do?), and check that all references are still current. Never remove debugging history sections from docs. Run `/code-hygiene` monthly or before major releases for a deep scan.

## Detailed Patterns

### The 4 Checks (Apply When Touching Any File)

1. **Inconsistencies** — Does this file conflict with related files or CLAUDE.md rules?
2. **Redundancy** — Is the same logic/content duplicated elsewhere? Consolidate or cross-reference.
3. **Clarity** — Would an AI reading this for the first time know exactly what to do?
4. **Up-to-dateness** — Are all references (file paths, function names, rule names) still current?

### History Preservation

**NEVER remove** these sections from docs:
- "Errors Encountered"
- "What NOT To Try Again"
- Debugging history sections

These prevent repeating failed approaches.

### Deep Scan

Run `/code-hygiene` monthly or before major releases — scans areas that haven't been recently touched.

## References

- [docs/06-operations/CODE_HYGIENE_STRATEGY.md](../../docs/06-operations/CODE_HYGIENE_STRATEGY.md)
