/**
 * /tools/sap-pro — SAP PRO: what a new advisor could earn in their first three
 * years from commission, the monthly and quarterly bonuses and the income
 * support scheme, month by month.
 *
 * Tool 08. Ported 2026-09-25 from the advisor's standalone
 * `income-illustrator2.html` ("Advisor income illustration"), figure for
 * figure and line for line — `lib/__tests__/sapPro.test.ts` locks the port
 * against that sheet's own rendered output.
 *
 * NO CUSTOMER BAR, unlike tools 04–07: the income illustrated is the ADVISOR's
 * (or a recruit's), not a customer's, so there is no record to pick, pre-fill
 * or log activity against. It therefore composes `ToolPageShell` +
 * `ToolPageHeader` directly rather than `PlanningToolFrame`. Nothing persists.
 * See planning/decisions.md 2026-09-25.
 */

import { useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/overlays/Tabs';
import { ToolPageHeader, ToolPageShell } from '@/components/primitives/tools';
import { toolRouteByKey } from '@/lib/toolRoutes';
import { SapProControls } from '../components/sappro/SapProControls';
import { SapProEquation } from '../components/sappro/SapProEquation';
import { SapProMonthsPanel } from '../components/sappro/SapProMonthsPanel';
import { SapProNotes } from '../components/sappro/SapProNotes';
import { SapProYears } from '../components/sappro/SapProYears';
import { SAP_DEFAULTS } from '../lib/sapProCopy';
import { illustrateIncome, monthlyBases, SAP_MONTHS, type SapTier } from '../lib/sapProMath';

const TOOL = toolRouteByKey('sappro');
const repeat = (amount: number) => Array.from({ length: SAP_MONTHS }, () => amount);

function SapPro() {
  const [tab, setTab] = useState<'calc' | 'notes'>('calc');
  const [tier, setTier] = useState<SapTier>(SAP_DEFAULTS.tier);
  const [flat, setFlat] = useState<number>(SAP_DEFAULTS.flat);
  const [rate, setRate] = useState<number>(SAP_DEFAULTS.rate);
  const [year, setYear] = useState<number>(SAP_DEFAULTS.year);
  const [custom, setCustom] = useState(false);
  const [months, setMonths] = useState<number[]>(() => repeat(SAP_DEFAULTS.flat));
  /** Bumped whenever the month grid is rewritten wholesale (the sheet's `buildGrid`). */
  const [gridVersion, setGridVersion] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  const illustration = illustrateIncome(tier, rate, monthlyBases(custom, flat, months));

  const fillMonths = (amount: number) => {
    setMonths(repeat(amount));
    setGridVersion((v) => v + 1);
  };
  const toggleCustom = (on: boolean) => {
    setCustom(on);
    // Turning it on starts every month at the flat amount; turning it off
    // keeps the grid but stops using it — both as the sheet does.
    if (on) fillMonths(flat);
  };
  const setMonth = (index: number, amount: number) =>
    setMonths((prev) => prev.map((value, i) => (i === index ? amount : value)));

  const showTab = (next: string) => setTab(next === 'notes' ? 'notes' : 'calc');
  /** The fine-print link sits a long scroll down; bring the notes into view. */
  const openNotes = () => {
    showTab('notes');
    tabsRef.current?.scrollIntoView({ block: 'start' });
  };

  return (
    <Tabs value={tab} onValueChange={showTab} ref={tabsRef} data-testid="sap-pro-tabs">
      <TabsList className="mb-6 w-full">
        <TabsTrigger value="calc" data-testid="sap-pro-tab-calc">
          Calculator
        </TabsTrigger>
        <TabsTrigger value="notes" data-testid="sap-pro-tab-notes">
          Scheme notes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calc">
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,380px)_1fr]">
          <div className="space-y-5">
            <SapProControls
              tier={tier}
              onTier={setTier}
              custom={custom}
              flat={flat}
              onFlat={setFlat}
              rate={rate}
              onRate={setRate}
            />
            <SapProMonthsPanel
              custom={custom}
              flat={flat}
              months={months}
              gridVersion={gridVersion}
              onToggle={toggleCustom}
              onFill={fillMonths}
              onMonth={setMonth}
            />
          </div>
          <div className="min-w-0 space-y-5">
            <SapProEquation
              years={illustration.years}
              year={year}
              onYear={setYear}
              tier={tier}
              custom={custom}
              rate={rate}
            />
            <SapProYears illustration={illustration} tier={tier} onNotes={openNotes} />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="notes">
        <SapProNotes />
      </TabsContent>
    </Tabs>
  );
}

export default function SapProPage() {
  return (
    <ToolPageShell>
      <ToolPageHeader title={TOOL.label} description={TOOL.description} index="08" testId="sap-pro" />
      <div data-testid="sap-pro">
        <SapPro />
      </div>
    </ToolPageShell>
  );
}
