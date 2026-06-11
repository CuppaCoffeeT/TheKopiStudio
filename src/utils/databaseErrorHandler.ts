/**
 * Database Error Handler Utility
 *
 * Provides user-friendly error messages for common database constraint violations
 * and other Supabase/PostgreSQL errors.
 *
 * @author Development Team
 * @version 1.0
 */

interface PostgresError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

/**
 * Parses Supabase/PostgreSQL error and returns a user-friendly message
 *
 * @param error - The error object from Supabase
 * @param entityName - The entity being created/updated (e.g., 'contact', 'user', 'project')
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await supabase.from('people').insert({ email: 'test@example.com' });
 * } catch (error) {
 *   const message = parseDatabaseError(error, 'contact');
 *   showEnhancedToast({ title: 'Error', description: message, variant: 'destructive' });
 * }
 * ```
 */
export function parseDatabaseError(error: unknown, entityName: string = 'record'): string {
  // Handle null/undefined errors
  if (!error) {
    return `Failed to create ${entityName}. Please try again.`;
  }

  const pgError = error as PostgresError;

  // Handle PostgreSQL constraint violations (code 23505 = unique_violation)
  if (pgError.code === '23505') {
    const message = pgError.message?.toLowerCase() || '';

    // Check for email constraint
    if (message.includes('people_email_unique')) {
      return `Cannot create ${entityName} - this email address is already registered in the system.`;
    }

    // Check for phone constraint
    if (message.includes('people_phone_unique')) {
      return `Cannot create ${entityName} - this phone number is already registered in the system.`;
    }

    // Generic unique constraint message
    return `Cannot create ${entityName} - this information is already registered in the system.`;
  }

  // Handle foreign key violations (code 23503)
  if (pgError.code === '23503') {
    return `Cannot create ${entityName} - invalid reference to related data.`;
  }

  // Handle not null violations (code 23502)
  if (pgError.code === '23502') {
    return `Cannot create ${entityName} - required field is missing.`;
  }

  // Handle check constraint violations (code 23514)
  if (pgError.code === '23514') {
    return `Cannot create ${entityName} - data validation failed.`;
  }

  // Handle RLS policy violations (code 42501)
  if (pgError.code === '42501') {
    return `You do not have permission to create this ${entityName}.`;
  }

  // If error has a message property, return it
  if (typeof pgError.message === 'string') {
    return pgError.message;
  }

  // Fallback to generic error message
  return `Failed to create ${entityName}. Please try again.`;
}

/**
 * Checks if an error is a duplicate key constraint violation
 *
 * @param error - The error object from Supabase
 * @returns true if the error is a duplicate key violation
 */
export function isDuplicateKeyError(error: unknown): boolean {
  return (error as PostgresError | null | undefined)?.code === '23505';
}

/**
 * Extracts the constraint name from a PostgreSQL unique violation error
 *
 * @param error - The error object from Supabase
 * @returns The constraint name (e.g., 'people_email_unique') or null
 */
export function getConstraintName(error: unknown): string | null {
  const pgError = error as PostgresError;
  const message = pgError.message || '';

  // Extract constraint name from error message
  // Format: 'duplicate key value violates unique constraint "constraint_name"'
  const match = message.match(/unique constraint "([^"]+)"/);
  return match ? match[1] : null;
}
