/**
 * Standalone tool routes — the app-level list of "things you do", each
 * reachable WITHOUT having chosen a customer first.
 *
 * WHY THIS EXISTS (2026-08-18): the planning tools and the client report used
 * to be sub-routes of a customer (`/clients/:id/tax-calculator`), so the only
 * way to reach one from navigation was a modal that asked "which customer?"
 * before the tool had even opened. That inverted the advisor's own order — they
 * pick the tool, then the customer, and often there is no customer at all
 * (a walk-in, a what-if). Each tool now owns a top-level route and asks for the
 * customer INSIDE itself, from a picker at the top of the page, via
 * `?customer=<id>`. The old customer sub-routes redirect here so existing
 * links, bookmarks and the customer-record launcher keep working.
 *
 * Layering: this file is deliberately app-level (`src/lib`) and imports
 * nothing. The nav rail is a `primitives/shell` component and may not import
 * from `features/`, but both it and the CRM feature need this list — and a
 * second hand-kept copy in the rail is exactly how a nav item ends up pointing
 * at a route that no longer exists.
 *
 * `module` is the module path the viewer must hold for the tool to be offered
 * (.claude/rules/module-access.md — never a role string). The three planning
 * tools and the client report read `public.clients`, so they ride on the
 * `/clients` grant exactly as their old sub-routes did; the profiler has its
 * own module because the public wizard is a module of its own.
 */

/** Query param carrying the chosen customer on every standalone tool route. */
export const CUSTOMER_PARAM = 'customer';

export const CLIENTS_MODULE = '/clients';
export const PROFILER_MODULE = '/profiler';

export interface ToolRoute {
  key: 'profiler' | 'tax' | 'srs' | 'legacy' | 'report';
  /** One name per tool, app-wide — the rail, the record launcher and the page
   *  title all read this. */
  label: string;
  path: string;
  module: string;
  /** One line under the page title saying what the tool does. */
  description: string;
}

export const TOOL_ROUTES: readonly ToolRoute[] = [
  {
    key: 'profiler',
    label: 'Prospect Profiler',
    path: '/profiler',
    module: PROFILER_MODULE,
    description: 'Runs the risk profile and saves the result onto the customer’s record.',
  },
  {
    key: 'tax',
    label: 'Tax calculator',
    path: '/tools/tax-calculator',
    module: CLIENTS_MODULE,
    description: 'Singapore resident income tax, relief by relief.',
  },
  {
    key: 'srs',
    label: 'SRS planner',
    path: '/tools/srs',
    module: CLIENTS_MODULE,
    description:
      'What contributing saves now, what the 10-year window costs, and whether the two net out.',
  },
  {
    key: 'legacy',
    label: 'Legacy Map',
    path: '/tools/legacy-planner',
    module: CLIENTS_MODULE,
    description:
      'Who inherits under the plan, against what the Intestate Succession Act would do instead.',
  },
  {
    key: 'report',
    label: 'Client Report',
    path: '/tools/client-report',
    module: CLIENTS_MODULE,
    description: 'The full printable financial report, from whatever the record holds today.',
  },
];

/** The tools this viewer may actually be offered, in fixed order. */
export function visibleToolRoutes(modules: readonly { path: string }[]): ToolRoute[] {
  return TOOL_ROUTES.filter((tool) => modules.some((mod) => mod.path === tool.module));
}

/** A tool's URL, with the customer carried when one has been chosen. */
export function toolHref(tool: Pick<ToolRoute, 'path'>, customerId?: string | null): string {
  return customerId ? `${tool.path}?${CUSTOMER_PARAM}=${customerId}` : tool.path;
}

/** Lookup by key — the customer-record launcher navigates by key, not by path. */
export function toolRouteByKey(key: ToolRoute['key']): ToolRoute {
  const found = TOOL_ROUTES.find((tool) => tool.key === key);
  if (!found) throw new Error(`Unknown tool route: ${key}`);
  return found;
}
