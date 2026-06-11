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

/**
 * Format a number as currency without the currency symbol
 *
 * @param amount - The amount to format
 * @returns Formatted number string (e.g., "1,234.56")
 *
 * @example
 * formatCurrencyValue(1234.567) // "1,234.57"
 * formatCurrencyValue(0) // "0.00"
 */
export const formatCurrencyValue = (amount: number): string => {
  return new Intl.NumberFormat('en-SG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Parse a currency string back to a number
 *
 * @param currencyString - The currency string to parse (e.g., "$1,234.56" or "1,234.56")
 * @returns Parsed number value
 *
 * @example
 * parseCurrency("$1,234.56") // 1234.56
 * parseCurrency("1,234.56") // 1234.56
 * parseCurrency("$0") // 0
 */
export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbol and commas
  const cleanedString = currencyString.replace(/[$,\s]/g, '');
  const value = parseFloat(cleanedString);
  return isNaN(value) ? 0 : value;
};
