# Security Policies
> Last updated: 2026-03-25

Security policies, authentication flows, and vulnerability analysis. Covers auth, user management, and access control at the system boundary level.

## What belongs here

- Authentication and authorization policies
- User account management (duplicates, normalization, approval workflows)
- Security audits and vulnerability remediation plans
- SEO/crawl blocking policies

## What does NOT belong here

- Database-level RLS patterns → `.claude/rules/rls-policy.md`
- Module-based access control (application layer) → `docs/01-system-architecture/MODULE_SYSTEM.md`
- Implementation plans for security features → `docs/05-implementation/active/`

## Navigation

| File | Covers |
|------|--------|
| `AUTH_USER_ID_NORMALIZATION.md` | Auth ID consistency across public.users |
| `DATABASE_SECURITY_VULNERABILITY_ANALYSIS_AND_REMEDIATION_PLAN.md` | Full security audit findings |
| `DUPLICATE_USER_ACCOUNT_ISSUE_AND_PREVENTION.md` | Duplicate user detection and prevention |
| `SEO_BLOCKING_GUIDE.md` | Preventing search engine indexing |
| `USER_APPROVAL_WORKFLOW.md` | New user registration approval flow |

## Before working here

- RLS enforcement: `.claude/rules/rls-policy.md` (minimal authenticated policy)
- Access control is at application layer: `docs/01-system-architecture/MODULE_SYSTEM.md`
- Auth implementation lives in: `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`
