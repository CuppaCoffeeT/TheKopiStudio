
export const smartTruncate = (text: string, maxLength: number, minChars: number = 5): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  if (maxLength < minChars) return text.substring(0, minChars) + '...';
  return text.substring(0, Math.max(minChars, maxLength - 3)) + '...';
};
