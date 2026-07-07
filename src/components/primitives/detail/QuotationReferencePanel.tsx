import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyHelper';

/**
 * QuotationReferencePanel — read-only quotation line-items reference for claim/invoice creation.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-27-EWSiu3Vc/project/ui_kits/appbase/src/QuotationReferencePanel.jsx
 * Preview: docs/99-refactor/_system/design/handoffs/2026-04-27-EWSiu3Vc/project/preview/component-quotation-reference-panel.html
 *
 * Replaces legacy `@/components/quotations/QuotationReferencePanel`. Same `items[]` API
 * (caller-side data shape unchanged); grouping by `quotation_id` happens inside.
 *
 * Locked: read-only · grouped by quotation_number · subtotal row tinted · tabular-num font on numerics ·
 *         empty state with FileText glyph · dark-mode mirror on every surface.
 */

export interface QuotationItemForInvoice {
  id: string;
  title: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  tax_rate: number;
  product_service_id: string | null;
  quotation_id: string;
  quotation_number: string;
  product_service_code: string | null;
  product_service_name: string | null;
}

interface QuotationReferencePanelProps {
  items: QuotationItemForInvoice[];
  className?: string;
}

const NUM_CELL = 'font-mono tabular-nums text-[12.5px]';

function formatQty(qty: number): string {
  const decimals = qty % 1 === 0 ? 0 : 2;
  return new Intl.NumberFormat('en-SG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(qty);
}

export function QuotationReferencePanel({ items, className }: QuotationReferencePanelProps) {
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { quotationNumber: string; total: number; items: QuotationItemForInvoice[] }
    >();
    items.forEach((item) => {
      let group = map.get(item.quotation_id);
      if (!group) {
        group = { quotationNumber: item.quotation_number, total: 0, items: [] };
        map.set(item.quotation_id, group);
      }
      group.items.push(item);
      group.total += item.quantity * item.unit_price;
    });
    return Array.from(map.values());
  }, [items]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-card font-sans',
        'border-border',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3.5',
          groups.length > 0 && 'border-b border-border',
        )}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[13px] font-semibold text-foreground">
            Linked quotations
          </span>
          {groups.length > 0 && (
            <span className="rounded-full border border-border bg-secondary px-1.5 py-px font-mono text-[10.5px] text-muted-foreground">
              {groups.length}
            </span>
          )}
        </div>
        <span className="text-[11.5px] text-muted-foreground">
          read-only · grouped by quotation_number
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-secondary text-muted-foreground">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div className="text-[13px] font-medium text-foreground">
            No quotations linked to this project
          </div>
          <p className="mt-1 text-[12px] leading-[1.5] text-muted-foreground">
            Quotations linked at the project level appear here for reference while you draft a claim or invoice.
          </p>
        </div>
      ) : (
        groups.map((group, gi) => (
          <div
            key={group.quotationNumber}
            className={cn(gi > 0 && 'border-t border-border')}
          >
            <div className="flex items-center justify-between bg-secondary px-4 py-3">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-0.5 font-mono text-[11.5px] font-medium text-muted-foreground">
                <FileText className="h-3 w-3 text-muted-foreground" />
                {group.quotationNumber}
              </span>
              <span className="text-[12px] text-muted-foreground">
                Total:{' '}
                <span className="font-medium text-muted-foreground">
                  <span className={NUM_CELL}>{formatCurrency(group.total)}</span>
                </span>
              </span>
            </div>

            <table className="w-full border-collapse text-[12.5px]">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="bg-secondary font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="border-b border-border px-4 py-2.5 text-left font-medium">
                    Item
                  </th>
                  <th className="border-b border-border px-4 py-2.5 text-left font-medium">
                    Code
                  </th>
                  <th className="border-b border-border px-4 py-2.5 text-right font-medium">
                    Qty
                  </th>
                  <th className="border-b border-border px-4 py-2.5 text-left font-medium">
                    Unit
                  </th>
                  <th className="border-b border-border px-4 py-2.5 text-right font-medium">
                    Unit Price
                  </th>
                  <th className="border-b border-border px-4 py-2.5 text-right font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item, i) => {
                  const lineTotal = item.quantity * item.unit_price;
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'align-top',
                        i > 0 && 'border-t border-border',
                      )}
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">
                        <div className="font-medium text-foreground">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="mt-0.5 max-w-[42ch] truncate text-[11px] text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11.5px] text-muted-foreground">
                        {item.product_service_code || '—'}
                      </td>
                      <td className={cn('px-4 py-2.5 text-right text-muted-foreground', NUM_CELL)}>
                        {formatQty(item.quantity)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {item.unit || '—'}
                      </td>
                      <td className={cn('px-4 py-2.5 text-right text-muted-foreground', NUM_CELL)}>
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className={cn('px-4 py-2.5 text-right font-semibold text-foreground', NUM_CELL)}>
                        {formatCurrency(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border bg-secondary">
                  <td
                    colSpan={5}
                    className="px-4 py-2.5 text-right font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground"
                  >
                    Subtotal (excl. GST)
                  </td>
                  <td className={cn('px-4 py-2.5 text-right font-semibold text-foreground', NUM_CELL)}>
                    {formatCurrency(group.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
