# Vercel Deployment Guide

**Created**: 2026-05-25 SGT
**Last Updated**: 2026-05-25 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical — production hosting

## 📋 Overview

The portal is hosted on Vercel under the **YOUR-TEAM** team. Production domain: `your-app.example.com`. Deploys are wired to the git repository (auto-deploy on push to `main`); the CLI is used locally for ad-hoc inspection (logs, env, deployments) and manual deploys.

## 📚 Related Documentation

- [EDGE_FUNCTION_DEPLOYMENT_GUIDE.md](./EDGE_FUNCTION_DEPLOYMENT_GUIDE.md) — Supabase edge function deploys (backend tier)
- [PDF_SERVICE_RAILWAY_DEPLOYMENT_GUIDE.md](./PDF_SERVICE_RAILWAY_DEPLOYMENT_GUIDE.md) — PDF microservice (Railway, not Vercel)
- [MCP_DB_ACCESS.md](./MCP_DB_ACCESS.md) — DB access from the deployed app
- Root `vercel.json` — SPA rewrite (all routes → `/index.html`)

## 🎯 Hosting Architecture

```
┌─────────────────────────────────────────────────┐
│ VERCEL (YOUR-TEAM team)                              │
│  Project: trench-trace-portal-app               │
│  Domain:  your-app.example.com                        │
│  Build:   Vite (npm run build → dist/)          │
│  Node:    24.x                                  │
│  Rewrites: /(.*) → /index.html  (vercel.json)   │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────┐
│ SUPABASE (your-project-ref)                 │
│  Postgres + Auth + Storage + Edge Functions     │
└─────────────────────────────────────────────────┘
```

## 🔧 CLI Setup (one-time)

```bash
npm install -g vercel        # installs the `vercel` binary
vercel login                 # browser OAuth → writes ~/.vercel/auth.json
vercel whoami                # confirm login
vercel teams ls              # confirm your-team team is visible
vercel link --scope your-team     # link this repo to the trench-trace-portal-app project
                             # writes .vercel/ (gitignored — do NOT commit)
```

**Current verified state (2026-05-25)**:

| Item | Value |
|------|-------|
| CLI version | 54.4.1 |
| Binary | `/opt/homebrew/bin/vercel` |
| Authenticated user | `weijie-4114` |
| Team | `your-team` (YOUR-TEAM) |
| Project | `trench-trace-portal-app` |
| Production URL | `https://your-app.example.com` |
| Node version | 24.x |

## 🛠 Common Commands

| Task | Command |
|------|---------|
| List deployments | `vercel ls --scope your-team` |
| Tail logs for prod | `vercel logs https://your-app.example.com --scope your-team` |
| List env vars | `vercel env ls --scope your-team` |
| Pull env to local | `vercel env pull .env.local --scope your-team` |
| Add env var | `vercel env add NAME production --scope your-team` |
| Deploy preview | `vercel --scope your-team` |
| Promote to prod | `vercel --prod --scope your-team` |
| Inspect deployment | `vercel inspect <deployment-url> --scope your-team` |
| List domains | `vercel domains ls --scope your-team` |

After `vercel link`, the `--scope your-team` flag becomes optional inside this repo (project context is read from `.vercel/project.json`).

## 🚀 Deploy Flow

**Default (git-driven, preferred)**:
1. Push to `main` → Vercel auto-deploys to `your-app.example.com`.
2. Push to any other branch → Vercel builds a preview deployment with a unique URL.

**Manual (CLI, when needed)**:
1. `vercel` → builds locally, uploads, returns a preview URL.
2. `vercel --prod` → same, but aliased to the production domain.

Build command: `npm run build` (Vite). Output directory: `dist/`. Both auto-detected — no override needed in `vercel.json`.

## 🔐 Environment Variables

Production env lives in the Vercel dashboard (Project → Settings → Environment Variables), not in the repo. Local dev uses `.env.local` (gitignored).

To sync prod env to local for debugging:
```bash
vercel env pull .env.local
```

**Never commit** `.env.local` or `.vercel/` — both are in `.gitignore`.

## ⚠️ Known Constraints

- **SPA rewrite is load-bearing** — `vercel.json` rewrites all paths to `/index.html` so React Router handles routing. Removing it breaks every deep link.
- **Single project, single team** — no staging Vercel project; previews on non-main branches serve as staging.
- **Build runs `npm run build`** — must stay green locally; husky pre-push runs typecheck + ESLint + (by default) the @p0 Playwright suite. Skip Playwright with `SKIP_E2E=1 git push` when only deploying docs.

## 🧰 Troubleshooting

| Symptom | First check |
|---------|-------------|
| Deploy fails on Vercel | `vercel logs <deployment-url>` — usually a TS/ESLint error caught by Vercel's build but not by local |
| 404 on deep link in prod | `vercel.json` rewrite rule got removed |
| Env var not picked up | `vercel env ls` — confirm it exists in the `production` environment, then re-deploy |
| Wrong team in CLI | `vercel switch your-team` or pass `--scope your-team` |
| Logged-out unexpectedly | `vercel login` again — token rotates after long idle |

## References

- Vercel CLI docs: https://vercel.com/docs/cli
- Project dashboard: https://vercel.com/your-team/trench-trace-portal-app
- Account tokens (if headless CI needed): https://vercel.com/account/tokens
