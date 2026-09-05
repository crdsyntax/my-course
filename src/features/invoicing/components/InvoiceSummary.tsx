import { useInvoiceCalculations } from '../hooks/useInvoiceCalculations';
import type { CurrencyCode, InvoiceItem } from '../types/invoice.types';
import { formatCurrency } from '../utils/format';

interface InvoiceSummaryProps {
  items: ReadonlyArray<InvoiceItem>;
  currency: CurrencyCode;
}

export function InvoiceSummary({ items, currency }: InvoiceSummaryProps) {
  const { totals } = useInvoiceCalculations(items);

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Resumen no disponible sin ítems.</p>;
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <h3 className="mb-3 text-base font-semibold text-slate-800">Resumen</h3>

      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="text-slate-500">Subtotal</dt>
          <dd className="font-medium">{formatCurrency(totals.subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Descuentos</dt>
          <dd className="font-medium text-rose-600">
            -{formatCurrency(totals.totalDiscount, currency)}
          </dd>
        </div>

        {totals.taxBreakdown.map((entry) => (
          <div key={`${entry.taxCategory}-${entry.taxRate}`} className="flex justify-between">
            <dt className="text-slate-500">
              IVA {(entry.taxRate * 100).toFixed(0)}%
            </dt>
            <dd className="font-medium">{formatCurrency(entry.taxAmount, currency)}</dd>
          </div>
        ))}

        <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base">
          <dt className="font-semibold text-slate-800">Total</dt>
          <dd className="font-bold text-indigo-700">
            {formatCurrency(totals.grandTotal, currency)}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
