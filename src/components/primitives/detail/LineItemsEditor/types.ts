/**
 * LineItemsEditor — public + internal types.
 *
 * Extracted from the former single-file primitive (2026-05-31 sub-module split).
 * Re-exported verbatim from `./index.tsx` so BOTH the barrel
 * (`@/components/primitives/detail`) and the deep path
 * (`@/components/primitives/detail/LineItemsEditor`) keep surfacing them.
 */

export type LineItemKind = 'item' | 'notes';

export type LineItem = {
  id: string;
  kind: LineItemKind;
  /** Product code (e.g. "JA-JAM72D30"). Split display; stored as part of label if code absent. */
  code?: string;
  /** Short product name. */
  name?: string;
  /** Sales description (long form). Falls back to `label` for legacy callers. */
  description?: string;
  /** Legacy single-line label — used when code/name/description are not split. */
  label?: string;
  qty?: number | null;
  unit?: string | null;
  price?: number | null;
  tax?: number | null;
  protected?: boolean;
};

export type LineItemField = 'qty' | 'price' | 'tax' | 'unit' | 'description' | 'code' | 'name' | 'label';

export interface LineItemRenderContext {
  item: LineItem;
  index: number;
  editable: boolean;
}

/** Per-field numeric cell for which a caller may want a stable test id. */
export type LineItemNumberField = 'qty' | 'price' | 'tax';

/**
 * Optional resolver that stamps a `data-testid` onto an editable numeric cell's
 * `<input>` (qty · price · tax). Default `undefined` → no attribute (zero change
 * for existing adopters). Used by feature specs that drive the grid via testids.
 */
export type LineItemFieldTestId = (ctx: {
  field: LineItemNumberField;
  index: number;
  item: LineItem;
}) => string | undefined;

export interface LineItemsEditorProps {
  items: LineItem[];
  onChange?: (next: LineItem[]) => void;
  onAddItem?: () => void;
  onAddNote?: () => void;
  onClearAll?: () => void;
  onRemoveItem?: (id: string) => void;
  taxLabel?: string;
  currency?: string;
  showEmpty?: boolean;
  className?: string;

  /** W09 P3 · M-line-items — turns qty/price/tax/description into live inputs. */
  editable?: boolean;
  /** Per-field patch callback. Called with a partial item keyed by the field that changed. */
  onPatchItem?: (id: string, patch: Partial<LineItem>) => void;
  /** Slot for the item cell (product autocomplete picker). Rendered in place of the default code+name display. */
  renderItemCell?: (ctx: LineItemRenderContext) => React.ReactNode;
  /** Slot for the unit cell (unit select). Rendered in place of the default unit text when editable. */
  renderUnitCell?: (ctx: LineItemRenderContext) => React.ReactNode;
  /** Optional stable test ids for the editable qty/price/tax inputs (opt-in). */
  fieldTestId?: LineItemFieldTestId;
  /** Additional trailing row (e.g. add-product link). Rendered below the add-item/note buttons. */
  footerExtras?: React.ReactNode;
}
