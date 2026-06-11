import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface TabDefinition {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ResponsiveTabsListProps {
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
  /** When set, each tab gets `data-testid={testidPrefix}-tab-{value}` (desktop) and `-mobile` suffix (mobile select). */
  testidPrefix?: string;
}

const gridColsMap: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
};

export function ResponsiveTabsList({ tabs, activeTab, onTabChange, className, testidPrefix }: ResponsiveTabsListProps) {
  const activeLabel = tabs.find(t => t.value === activeTab)?.label ?? '';

  return (
    <>
      {/* Mobile: Select dropdown */}
      <div className={cn('block md:hidden', className)}>
        <Select value={activeTab} onValueChange={onTabChange}>
          <SelectTrigger
            className="w-full"
            aria-label="Select tab"
            data-testid={testidPrefix ? `${testidPrefix}-tab-trigger-mobile` : undefined}
          >
            <SelectValue>{activeLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tabs.map(tab => (
              <SelectItem
                key={tab.value}
                value={tab.value}
                data-testid={testidPrefix ? `${testidPrefix}-tab-${tab.value}-mobile` : undefined}
              >
                <span className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Standard TabsList */}
      <TabsList className={cn('hidden md:grid w-full', gridColsMap[tabs.length] || 'grid-cols-4', className)}>
        {tabs.map(tab => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex items-center gap-1 text-xs lg:text-sm"
            data-testid={testidPrefix ? `${testidPrefix}-tab-${tab.value}` : undefined}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </>
  );
}
