# Edge Functions — Decisions

**Last Updated**: 2026-05-26 SGT

Workspace-scoped per [`.claude/rules/lessons-logging.md`](../../.claude/rules/lessons-logging.md). Cross-domain entries get promoted to a parent `lessons.md`.

## 2026-05-26 — Extract `_shared/refreshInvoice.ts` + `refreshInvoicesBulk.ts` + new `refreshContact.ts`

**Decision**: `xero-webhook` must reuse — not reimplement — the Xero pull logic that lives in `xero-sync/index.ts`. Pull `handleRefreshInvoiceFromXero` (:1090) and `handleInvoicesRefresh` (:1477) into `_shared/` modules; both `xero-sync` HTTP handlers become thin routers that call into them. Add a sibling `_shared/refreshContact.ts` for the CONTACT webhook path that mirrors what `handleContacts` does but for a single ContactID.

**Why**: A second HTTP hop from `xero-webhook` → `xero-sync` would double the request cost and lose typed errors. User approved Q5 on 2026-05-26 to extract both refresh handlers at the same time rather than deferring `handleInvoicesRefresh` to a later card.

**Impact**: `xero-sync` shrinks slightly; one module per Xero-pull concern; same `xero_sync_log` rows + same DB writes (zero behavior diff verified by running PM Tab 2 Refresh after Phase 2). Future webhook expansion (e.g. ITEM events) follows the same `_shared/` pattern.

## 2026-05-26 — `xero-webhook` deployed with `--no-verify-jwt`; HMAC is the authn layer

**Decision**: Public endpoint (no Supabase JWT requirement). All trust derives from HMAC-SHA256 signature verification against `XERO_WEBHOOK_KEY` (separate Supabase secret from OAuth client secret). Signature is computed over the **raw, unparsed** request body. Constant-time compare. Invalid signature OR missing header → 401 (also serves as the Xero Intent-to-Receive handshake).

**Why**: Xero's webhook publisher cannot present a Supabase JWT, and adding a shared bearer token would just be a weaker HMAC. The ITR handshake spec explicitly requires the endpoint to verify signatures and reject the initial test event with 401 before Xero will activate the subscription.

**Impact**: Deploy command is `mcp__supabase__deploy_edge_function … --no-verify-jwt`. Function must always read `req.text()` BEFORE `JSON.parse()` — flipping the order silently breaks signature verification (canonical body changes).
