# Toast System Documentation

**Created**: 2025-09-12 08:15:00 SGT  
**Last Updated**: 2025-09-12 08:15:00 SGT  
**Status**: 🟢 Production  
**Priority**: ⚪ Low  

## 📋 Overview
[Document overview and purpose]

## 📚 Related Documentation
[Links to related documents]


## Overview

This project uses **Sonner** as the single, unified toast notification system. All toast notifications throughout the application should use the helper functions from `src/utils/toastHelper.ts`.

## ⚠️ IMPORTANT: DO NOT use shadcn/ui toast

The shadcn/ui toast system (`useToast` hook) has been **completely removed** from this project. Using it will cause build errors.

## Usage

### Import the toast helper

```typescript
import { showEnhancedToast, showSuccess, showError, showInfo, showWarning } from '@/utils/toastHelper';
```

### Basic Usage

```typescript
// Success toast
showSuccess("Operation completed successfully");

// Error toast  
showError("Something went wrong");

// Info toast
showInfo("Here's some information");

// Warning toast
showWarning("Please be careful");
```

### Enhanced Toast with Title and Description

```typescript
// Success with title and description
showEnhancedToast({
  title: "Success",
  description: "User has been created successfully",
});

// Error with title and description
showEnhancedToast({
  title: "Error", 
  description: "Failed to save data",
  variant: "destructive",
});

// Info with title and description
showEnhancedToast({
  title: "Information",
  description: "Please check your email for confirmation",
});
```

## Available Functions

### `showEnhancedToast(options)`
The main function for displaying toasts with full customization.

**Options:**
- `title?: string` - Toast title
- `description?: string` - Toast description  
- `variant?: "default" | "destructive"` - Toast style (default: "default")

### Convenience Functions
- `showSuccess(message: string)` - Green success toast
- `showError(message: string)` - Red error toast  
- `showInfo(message: string)` - Blue info toast
- `showWarning(message: string)` - Yellow warning toast

## Toast Configuration

Toasts are configured to:
- Display for 3 seconds
- Appear in the bottom-right corner
- Support both title+description and simple message formats

## Migration from shadcn/ui toast

If you encounter code using the old shadcn/ui toast system, replace:

```typescript
// ❌ OLD - DO NOT USE
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();

toast({
  title: "Success",
  description: "Operation completed",
  variant: "destructive",
});
```

```typescript
// ✅ NEW - USE THIS
import { showEnhancedToast } from '@/utils/toastHelper';

showEnhancedToast({
  title: "Success", 
  description: "Operation completed",
  variant: "destructive",
});
```

## Why Sonner?

- **Better UX**: More polished animations and interactions
- **Simpler API**: No hook required, direct function calls
- **Better Performance**: Lighter weight than shadcn/ui toast
- **Consistent**: Single source of truth for all notifications
- **Flexible**: Supports both simple messages and complex title+description

## Troubleshooting

### Build Error: "Cannot find module '@/hooks/use-toast'"
This means you're trying to use the old shadcn/ui toast system. Replace with Sonner toast helper as shown above.

### Build Error: "Cannot find name 'toast'"  
This means you removed the `useToast` import but still have `toast()` function calls. Replace them with `showEnhancedToast()` calls.

### Toasts not appearing
1. Make sure you've imported the toast helper functions
2. Check that the Sonner `Toaster` component is included in `App.tsx`
3. Verify you're using the correct function names

## Relationship to Notification System

This project uses **two separate notification systems**:

### Toasts (Sonner) - Immediate Feedback
- **Purpose**: Immediate user feedback for actions
- **Duration**: 3-5 seconds, auto-dismiss
- **Use cases**: "Saved successfully", "Error occurred", "Processing..."
- **Visibility**: Current session only
- **User control**: Auto-dismiss, no management needed

### Notification System - Persistent Alerts
- **Purpose**: Workflow updates, assignments, persistent alerts
- **Duration**: Until user reads/dismisses or auto-cleared
- **Use cases**: "New assignment", "Approval needed", "Item rejected"
- **Visibility**: Persists across sessions, stored in database
- **User control**: Full management (read, dismiss, filter, search)

### When to Use Which?

```typescript
// ✅ Use TOASTS for immediate action feedback
showSuccess("Changes saved successfully");
showError("Failed to upload file");

// ✅ Use NOTIFICATIONS for workflow/persistent alerts
// (handled automatically by database triggers)
```

## Best Practices

1. **Use descriptive titles**: Help users understand what happened
2. **Keep descriptions concise**: Don't overload with information  
3. **Use appropriate variants**: `destructive` for errors, `default` for success/info
4. **Avoid toast spam**: Don't show multiple toasts for the same action
5. **Test in both light and dark modes**: Ensure toasts are visible in all themes
6. **Choose the right system**: Toasts for feedback, notifications for persistence

## Examples in the Codebase

Look at these files for real examples:
- `src/hooks/useWorkflowStatus.ts` - Workflow actions
- `src/components/coordinator/ClarificationTable.tsx` - Data operations  
- `src/components/LogoutButton.tsx` - Authentication actions
- `src/pages/AdminApproval.tsx` - Form submissions