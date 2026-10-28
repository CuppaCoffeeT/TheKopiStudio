/**
 * Currency Formatting Utility
 *
 * Provides consistent currency formatting across the application.
 * All monetary values are formatted as Singapore Dollars (SGD).
 *
 * Part of Phase 2A: Direct Invoice (Claims Module) implementation.
 */

/**
 * Format a number as Singapore Dollar currency
 *
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 *
 * @example
 * formatCurrency(1234.567) // "$1,234.57"
 * formatCurrency(0) // "$0.00"
 * formatCurrency(-500) // "-$500.00"
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
