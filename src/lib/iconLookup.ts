/**
 * iconLookup — resolve a `public.modules.icon_name` string (PascalCase lucide
 * name, e.g. 'LayoutDashboard' / 'Briefcase') to its lucide-react component.
 * Unknown / empty names fall back to LayoutGrid so a bad seed row can never
 * crash the dashboard grid.
 */

import { icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS = icons as Record<string, LucideIcon>;

export function getModuleIcon(iconName: string): LucideIcon {
  return ICONS[iconName] ?? icons.LayoutGrid;
}
