# Git Sync Command

Check through the entire codebase for changes and status. Then:
1. **Migration check**: Run `mcp__supabase__list_migrations` and compare against local `supabase/migrations/` files. Any local file NOT in Supabase's list = unexecuted. Execute gaps via Supabase MCP. If a local file appears to be a duplicate of an already-applied migration, confirm with user before deleting.
2. Run `/check-docs` — validate doc index health (broken links, unlisted files, wrong counts). Fix any issues before committing.
3. **Review edited docs** — For any `.md` files in the staged changes, run the `/check-docs` evaluation criteria (inconsistencies, redundancy, clarity, up-to-dateness) on those files only. Fix issues and append non-obvious lessons to the relevant workspace `lessons.md` per `/check-docs` step 6. Skip this if no `.md` files were changed.
4. Quick root check — delete any `tmpclaude-*` temp files found in root before staging (these should never be committed).
5. **CONTEXT.md freshness warning** — Check if any CONTEXT.md file in a modified folder has a "Last updated" date >30 days old. If so, warn: `"[folder]/CONTEXT.md was last updated [N] days ago. Review before committing?"` This is a warning only — user decides whether to update.
6. Pull latest changes from git
7. Add all changes
8. Commit with a descriptive message
9. **Ask which branch to push to** — list local branches; default to the current working branch. Never assume `main`. Push to the user's chosen branch.
10. Let user know anything else to take note

Guidelines:
- Show a clear summary of changed files before committing
- Ask for confirmation of the commit message before pushing
- Handle any merge conflicts appropriately
- Show the final status after push