/**
 * Format a number with commas for thousands and millions
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with commas
 *
 * @example
 * formatNumberWithCommas(1234.56) // "1,234.56"
 * formatNumberWithCommas(1234567.89) // "1,234,567.89"
 * formatNumberWithCommas(123.456, 3) // "123.456"
 */
export function formatNumberWithCommas(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  // Format the number with fixed decimals
  const fixed = value.toFixed(decimals);

  // Split into integer and decimal parts
  const parts = fixed.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add commas to integer part
  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Combine with decimal part
  return decimalPart ? `${withCommas}.${decimalPart}` : withCommas;
}
