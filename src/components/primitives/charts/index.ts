/**
 * Charts primitives barrel — 8 primitives from the 2026-04-20-nl73fwyg handoff.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 */

export { ChartShell, AxisX, AxisY, GridLines } from './ChartShell';
export type { AxisTick } from './ChartShell';

export { AreaChart } from './AreaChart';
export type { AreaSeries } from './AreaChart';

export { BarChart } from './BarChart';
export type { BarSeries } from './BarChart';

export { HBarChart } from './HBarChart';
export type { HBarRow } from './HBarChart';

export { ChartTooltip } from './ChartTooltip';
export type { ChartTooltipRow } from './ChartTooltip';

export { ChartLoading } from './ChartLoading';
export { ChartError } from './ChartError';

export { LegendRow } from './LegendRow';
export type { LegendItem } from './LegendRow';
