---
paths:
  - src/**/*.ts
  - src/**/*.tsx
---

# Rule: Toast System (Sonner Only)

## Summary

The project uses Sonner as the sole toast notification library. The old shadcn/ui `useToast` hook has been removed from the project. All toast notifications must use the helper functions from `@/utils/toastHelper`.

## Detailed Patterns

```typescript
// ✅ CORRECT
import { showSuccess, showError, showEnhancedToast } from '@/utils/toastHelper';
showSuccess("Operation completed");
showError("Something went wrong");

// ❌ FORBIDDEN (removed from project)
import { useToast } from '@/hooks/use-toast';
```

### Available Helpers

| Function | Purpose |
|----------|---------|
| `showSuccess(message)` | Green success toast |
| `showError(message)` | Red error toast |
| `showEnhancedToast(options)` | Advanced toast with custom styling |

## References

- Source: `src/utils/toastHelper.ts`
