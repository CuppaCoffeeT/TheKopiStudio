/**
 * LegacyAssetsPanel — what the estate is made of, and where each piece goes.
 *
 * Extracted from `LegacyPlannerPage` (W23 LOC ceiling).
 *
 * The nominatable/estate badge is the panel's teaching point: CPF and life
 * insurance pass by NOMINATION, outside the will and outside the Intestate
 * Succession Act. Everything else is governed by the will — or, with no will,
 * by the Act. CPF additionally cannot be willed at all, which is why an
 * un-nominated CPF row carries its own warning.
 */

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/primitives/form';
import { Badge } from '@/components/primitives/shell/Badge';
import { Button } from '@/components/primitives/shell/Button';
import { ToolPanel, ToolSelect } from '../PlanningAtoms';
import { ASSET_TYPES, assetTypeFor, isNominated, type Asset, type LegacyPlan } from '../../lib/legacy';

/**
 * Radix Select forbids an empty-string item value (it reserves '' for "clear"),
 * so the not-directed option carries this sentinel and is mapped back to '' at
 * the callsite.
 */
const NOT_DIRECTED = '__none__';

interface LegacyAssetsPanelProps {
  plan: LegacyPlan;
  beneficiaries: { id: string; label: string }[];
  onAddAsset: () => void;
  onUpdateAsset: (id: string, patch: Partial<Asset>) => void;
  onRemoveAsset: (id: string) => void;
  onAssign: (assetId: string, personId: string) => void;
  currentAssignee: (assetId: string) => string;
}

export function LegacyAssetsPanel({
  plan, beneficiaries, onAddAsset, onUpdateAsset, onRemoveAsset, onAssign, currentAssignee,
}: LegacyAssetsPanelProps) {
  const addAsset = onAddAsset;
  const updateAsset = onUpdateAsset;
  const removeAsset = onRemoveAsset;
  const assignWholeAsset = onAssign;

  return (
<ToolPanel label="Assets" testId="legacy-assets">
  {plan.assets.length === 0 && (
    <p className="m-0 mb-3 text-[12px] text-muted-foreground">
      No assets yet — add what the estate is made of.
    </p>
  )}
  {plan.assets.map((asset) => {
    const type = assetTypeFor(asset.type);
    const nominated = isNominated(plan, asset.id);
    return (
      <div
        key={asset.id}
        className="mb-3 rounded-lg border border-border bg-popover px-3 py-3"
        data-testid={`legacy-asset-${asset.id}`}
      >
        <div className="mb-2 flex items-center gap-2">
          <Input
            value={asset.name}
            placeholder="Asset name"
            onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
            className="flex-1 pointer-coarse:text-[16px]"
            aria-label="Asset name"
          />
          <Button
            variant="ghost"
            size="xs"
            className="flex-none text-destructive"
            aria-label={`Remove ${asset.name || 'asset'}`}
            onClick={() => removeAsset(asset.id)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ToolSelect
            value={asset.type}
            onChange={(type) => updateAsset(asset.id, { type })}
            ariaLabel="Asset type"
            options={ASSET_TYPES.map((t) => ({ value: t.id, label: t.label }))}
          />
          <Input
            type="number"
            min={0}
            value={asset.value === 0 ? '' : String(asset.value)}
            placeholder="Value"
            onChange={(e) => updateAsset(asset.id, { value: Number(e.target.value) || 0 })}
            className="pointer-coarse:text-[16px]"
            aria-label="Value"
          />
          <Input
            type="number"
            step="0.5"
            value={asset.growthPct === 0 ? '' : String(asset.growthPct)}
            placeholder="Growth %"
            onChange={(e) => updateAsset(asset.id, { growthPct: Number(e.target.value) || 0 })}
            className="pointer-coarse:text-[16px]"
            aria-label="Annual growth percent"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={type.nominatable ? 'accent' : 'neutral'} dot={false} className="flex-none">
            {type.nominatable ? (type.nominationLabel ?? 'Nominatable') : 'Estate asset'}
          </Badge>
          <ToolSelect
            value={currentAssignee(asset.id) || NOT_DIRECTED}
            onChange={(personId) =>
              assignWholeAsset(asset.id, personId === NOT_DIRECTED ? '' : personId)
            }
            ariaLabel={type.nominatable ? 'Nominee' : 'Beneficiary under the will'}
            options={[
              {
                value: NOT_DIRECTED,
                label: type.forced
                  ? 'Not nominated — goes to the Public Trustee'
                  : 'Not directed',
              },
              ...beneficiaries.map((b) => ({ value: b.id, label: b.label })),
            ]}
            className="flex-1"
            testId={`legacy-assign-${asset.id}`}
          />
        </div>
        {type.forced && !nominated && (
          <p className="m-0 mt-2 text-[11.5px] text-[color:var(--negative-text)]">
            CPF can only pass by nomination — a will cannot direct it.
          </p>
        )}
      </div>
    );
  })}
  <Button
    variant="outline"
    size="sm"
    leadingIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
    onClick={addAsset}
    data-testid="legacy-add-asset"
  >
    Add asset
  </Button>
</ToolPanel>
  );
}
