import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandState } from 'cmdk';
import { useAuth } from '@/contexts/AuthContext';
import { getModuleIcon } from '@/lib/iconLookup';
import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteSeparator,
  useCommandPaletteHotkey,
} from '@/components/primitives/overlays';
import {
  groupModulesByCategory,
  getRecentModules,
  addRecentModule,
  type DashboardModule,
} from '@/utils/dashboardHelpers';

const GlobalCommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { modules } = useAuth();

  useCommandPaletteHotkey(useCallback(() => setOpen((prev) => !prev), []));

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  const categories = useMemo(
    () => groupModulesByCategory(modules as DashboardModule[]),
    [modules]
  );

  const recentModules = useMemo(() => {
    const paths = getRecentModules();
    return paths
      .map((path) => modules.find((m) => m.path === path))
      .filter(Boolean) as DashboardModule[];
  }, [modules]);

  const handleSelect = (path: string) => {
    addRecentModule(path);
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandPalette open={open} onOpenChange={setOpen} placeholder="Search modules…">
      <CommandPaletteEmpty>No modules found.</CommandPaletteEmpty>

      <RecentSection modules={recentModules} onSelect={handleSelect} />

      {categories.map((cat) => (
        <CommandPaletteGroup key={cat.key} heading={cat.label}>
          {cat.modules.map((mod) => (
            <ModuleItem
              key={`${cat.key}:${mod.path}`}
              sectionKey={cat.key}
              module={mod}
              onSelect={handleSelect}
            />
          ))}
        </CommandPaletteGroup>
      ))}
    </CommandPalette>
  );
};

/**
 * Recent has no relevance score against an active query — pinning it on top
 * during search broke ranking (e.g. "worker" surfaced last-visited Performance
 * Review above Worker Management). Hide it while the user is typing; restore
 * for empty-query browsing (the "jump back where I was" semantic).
 */
function RecentSection({
  modules,
  onSelect,
}: {
  modules: DashboardModule[];
  onSelect: (path: string) => void;
}) {
  const search = useCommandState((state) => state.search);
  if (search.trim() !== '' || modules.length === 0) return null;
  return (
    <>
      <CommandPaletteGroup heading="Recent">
        {modules.map((mod) => (
          <ModuleItem
            key={`recent:${mod.path}`}
            sectionKey="recent"
            module={mod}
            onSelect={onSelect}
          />
        ))}
      </CommandPaletteGroup>
      <CommandPaletteSeparator />
    </>
  );
}

/**
 * Module name goes into `value` (primary, higher weight); description goes
 * into `keywords` (secondary, lower weight). cmdk's default ranker scores
 * `value` matches above `keywords` matches, so a name hit beats a description
 * hit — fixing the "search 'project' returns Quotation Management above
 * Project Management" issue.
 */
function ModuleItem({
  sectionKey,
  module: mod,
  onSelect,
}: {
  sectionKey: string;
  module: DashboardModule;
  onSelect: (path: string) => void;
}) {
  const Icon = getModuleIcon(mod.icon_name);
  return (
    <CommandPaletteItem
      value={`${sectionKey}:${mod.path}:${mod.name}`}
      keywords={mod.description ? [mod.description] : undefined}
      onSelect={() => onSelect(mod.path)}
      icon={<Icon className="w-3.5 h-3.5" strokeWidth={1.4} />}
      label={mod.name}
      description={mod.description}
    />
  );
}

export default GlobalCommandPalette;
