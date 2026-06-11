---
paths:
  - src/**/*.ts
  - src/**/*.tsx
---

# Rule: Module-Based RBAC (No Hardcoded Roles)

## Summary

Access control is enforced at the application level using a module-based system, not hardcoded role checks. Each user's accessible modules are determined by their role's `role_modules` and any individual `user_modules` overrides. Always check module access via the `useAuth()` hook and the module's path, never by comparing against role name strings.

## Detailed Patterns

```typescript
// ✅ CORRECT: Module-based access control
const { user, modules } = useAuth();
const hasAccess = modules.some(m => m.path === '/module-path');

// ❌ WRONG: Hardcoded role checks
if (!['management', 'super_admin'].includes(user.role)) { }
```

### Key Tables

- `modules` — defines all available modules with paths and metadata
- `role_modules` — maps roles to their default modules
- `user_modules` — per-user module overrides

### Roles

`super_admin`, `management`, `coordinator`, `supervisor`, `drafter`, `Office_admin`

> For the latest roles, check the `roles` table using Supabase MCP.

### Standard Module Page Pattern

```typescript
const { user, modules, loading } = useAuth();
const hasAccess = modules.some(m => m.path === MODULE_PATH);
```

### Module Creation (3 Steps)

1. **Migration**: Insert into `modules` + `role_modules` tables
2. **Route**: Add to `src/App.tsx` (path must match DB)
3. **Component**: Use `DashboardHeader` with `useAuth` access check

**Icons**: Lucide only (https://lucide.dev/icons/)

## References

- [docs/01-system-architecture/MODULE_SYSTEM.md](../../docs/01-system-architecture/MODULE_SYSTEM.md)
- Related: [rls-policy.md](./rls-policy.md) — Database-level security (minimal by design, since access control is here)
