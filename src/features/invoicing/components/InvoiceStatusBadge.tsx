import type { InvoiceStatus } from '../types/invoice.types';

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
  ISSUED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  PAID: 'bg-blue-100 text-blue-700 border-blue-300',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-300',
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Borrador',
  ISSUED: 'Emitida',
  PAID: 'Pagada',
  CANCELLED: 'Anulada',
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const style = STATUS_STYLES[status];
  const label = STATUS_LABELS[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style}`}
      role="status"
    >
      {label}
    </span>
  );
}
