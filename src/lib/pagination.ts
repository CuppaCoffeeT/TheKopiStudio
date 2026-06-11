/**
 * paginationRange — compute the "1–100 of 487" from/to indices for primitive
 * `<Pagination>`. Handles the empty-list case (returns `from: 0`).
 *
 * Spread the result into `<Pagination from={...} to={...} ... />` to satisfy
 * its required props.
 */
export function paginationRange(page: number, pageSize: number, total: number) {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return { from, to };
}
