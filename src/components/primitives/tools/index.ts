/**
 * Tool chrome — the shared shell, header, customer bar and panel atoms behind
 * every numbered tool in `src/lib/toolRoutes`. See CONTEXT.md.
 *
 * This barrel is the import surface. Consumers write
 * `from '@/components/primitives/tools'` and never a deep path, which is what
 * let `ToolAtoms.tsx` split into ToolPanel / ToolFigures / ToolSelect without
 * touching a single call site.
 */

export { ToolPageShell } from './ToolPageShell';
export { ToolPageHeader } from './ToolPageHeader';
export { ToolCustomerBar } from './ToolCustomerBar';
export { ToolPanel } from './ToolPanel';
export { ToolStatGrid, SummaryRow, type ToolStat } from './ToolFigures';
export { ToolSelect, ToolNote, type ToolSelectOption } from './ToolSelect';
