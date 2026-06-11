#

**Created**: 2025-09-12 08:15:00 SGT
**Last Updated**: 2025-09-12 08:15:00 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview
[Document overview and purpose]

## 📚 Related Documentation
[Links to related documents]


Enable the AI to analyze and query your live Supabase database directly via Cursor MCP (Model Context Protocol) without local dumps or psql. This keeps everything live, secure, and simple.

### What this enables
- The AI can list tables, inspect columns, and run SQL (read-only by default) using your Supabase MCP tool.
- No manual dumps, Docker, or DSNs are required.

### What this does not do
- Without explicit permission, the AI will not run write operations. Keep the MCP server in `--read-only` mode to enforce this.

---

## Prerequisites (Cursor MCP)
- Cursor installed
- Supabase personal access token (Dashboard → Account → Access Tokens)
- `.cursor/mcp.json` configured for the Supabase MCP server, for example:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "--package=@supabase/mcp-server-supabase@latest",
        "--package=graphql",
        "mcp-server-supabase",
        "--project-ref",
        "<your-project-ref>",
        "--read-only"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<your_personal_access_token>"
      }
    }
  }
}
```

Restart Cursor. In Settings → MCP Tools, ensure the Supabase server shows a green dot and exposes tools like `list_tables`, `execute_sql`, and `generate_typescript_types`.

---

## Common tasks (live, via MCP)

- List tables (example schemas):
  - Use the `list_tables` tool with schemas `public`, `auth`, `storage`.

- Inspect columns for a table:
  - Run a read-only query via `execute_sql`, e.g.:
    ```sql
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'worker_ot'
    order by ordinal_position;
    ```

- Get row counts for key tables:
  - `execute_sql` with:
    ```sql
    select 'worker_ot' as table, count(*) from public.worker_ot
    union all
    select 'trial_trenches', count(*) from public.trial_trenches
    union all
    select 'projects', count(*) from public.projects;
    ```

- Generate TypeScript types for the public schema:
  - Use `generate_typescript_types` (returns types in the MCP response).

---

## Enabling writes (optional)
- By default, the example config uses `--read-only` so the AI cannot modify data.
- If you need migrations or data fixes through MCP tools (`apply_migration`, `execute_sql` with DDL/DML), remove `--read-only` in `.cursor/mcp.json`, restart Cursor, and explicitly ask the AI to run the change. Proceed with caution and consider backing up.

---

## Security
- Keep your access token scoped to the project and rotate it periodically.
- Prefer `--read-only` for day‑to‑day analysis. Temporarily lift to write only when required.
- RLS still applies to PostgREST/API access; `execute_sql` runs at the database level using service credentials behind the MCP server, so treat writes with care.

---

## Change control policy (required approvals)

To prevent unintended changes, follow this approval flow:

- Default: keep MCP in `--read-only` in `.cursor/mcp.json`.
- To allow writes, you must provide explicit approval in chat using this exact format:
  - Approve DDL (schema changes: create/alter/drop):
    - `APPROVE DDL: <brief summary of the change>`
  - Approve DML (data changes: insert/update/delete):
    - `APPROVE DML: <brief summary of the change>`

- After the change, I will confirm results and you can re-enable `--read-only`.

Recommended flow for bigger changes:
1) Use MCP tools to `create_branch` (Supabase dev branch)
2) Apply the DDL/DML on the branch
3) Validate
4) `merge_branch` to production

You can also add the following reminder to `.cursor/config.json` under project notes or prompts to show in every session:

"Always require explicit 'APPROVE DDL' or 'APPROVE DML' from the user before executing any write SQL or migrations."

---

## Troubleshooting
- Supabase MCP shows a red dot in Cursor:
  - Ensure `SUPABASE_ACCESS_TOKEN` is valid and has access to the project
  - Ensure `--project-ref` matches your project
  - Include `graphql` as shown above (required peer dep)
  - Try pinning a specific server version instead of `@latest`
- Tools missing (e.g., no `execute_sql`): restart Cursor after editing `.cursor/mcp.json`.

---

## FAQ
- Do I still need local dumps or psql?
  - No. With MCP configured, the AI can fetch schema and run SQL live against Supabase.
- Can the AI edit data?
  - Only if you remove `--read-only` and explicitly ask it to run write queries.
