import { createPortal } from 'react-dom';
import type { InvoiceHeader, InvoiceItem, InvoiceStatus } from '../types/invoice.types';
import { useInvoiceCalculations } from '../hooks/useInvoiceCalculations';
import { formatCurrency } from '../utils/format';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoicePrintModalProps {
  header: InvoiceHeader;
  items: ReadonlyArray<InvoiceItem>;
  status?: InvoiceStatus;
  onClose: () => void;
}

export function InvoicePrintModal({
  header,
  items,
  status = 'ISSUED',
  onClose,
}: InvoicePrintModalProps) {
  const { lines, totals } = useInvoiceCalculations(items);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="my-6 w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="print-area p-8">
          <header className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Factura</h1>
              <p className="text-sm text-slate-500">
                Correlativo: {header.correlationCode}
              </p>
            </div>
            <InvoiceStatusBadge status={status} />
          </header>

          <section className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <h2 className="font-semibold text-slate-700">Emisor</h2>
              <p>{header.issuer.legalName}</p>
              <p className="text-slate-500">NIT {header.issuer.taxId}</p>
              <p className="text-slate-500">{header.issuer.address}</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-700">Cliente</h2>
              <p>{header.customer.legalName}</p>
              <p className="text-slate-500">NIT {header.customer.taxId}</p>
              <p className="text-slate-500">{header.customer.address}</p>
            </div>
          </section>

          <section className="mb-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
            <p>Emisión: {header.issueDate}</p>
            <p>Vencimiento: {header.dueDate}</p>
          </section>

          <table className="mb-6 w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-2 py-2">Descripción</th>
                <th className="px-2 py-2">Cant.</th>
                <th className="px-2 py-2">Precio</th>
                <th className="px-2 py-2">Desc.</th>
                <th className="px-2 py-2">Imp.</th>
                <th className="px-2 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.item.id} className="border-t border-slate-200">
                  <td className="px-2 py-2">{line.item.description}</td>
                  <td className="px-2 py-2">{line.item.quantity}</td>
                  <td className="px-2 py-2">
                    {formatCurrency(line.item.unitPrice, header.currency)}
                  </td>
                  <td className="px-2 py-2">{(line.item.discountRate * 100).toFixed(0)}%</td>
                  <td className="px-2 py-2">{(line.item.taxRate * 100).toFixed(0)}%</td>
                  <td className="px-2 py-2 text-right">
                    {formatCurrency(line.lineTotal, header.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="ml-auto w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd>{formatCurrency(totals.subtotal, header.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Descuentos</dt>
              <dd>-{formatCurrency(totals.totalDiscount, header.currency)}</dd>
            </div>
            {totals.taxBreakdown.map((entry) => (
              <div key={`${entry.taxCategory}-${entry.taxRate}`} className="flex justify-between">
                <dt className="text-slate-500">IVA {(entry.taxRate * 100).toFixed(0)}%</dt>
                <dd>{formatCurrency(entry.taxAmount, header.currency)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatCurrency(totals.grandTotal, header.currency)}</dd>
            </div>
          </dl>
        </div>

        <div className="no-print flex justify-end gap-3 border-t border-slate-200 p-4">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            onClick={() => window.print()}
          >
            Imprimir
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
