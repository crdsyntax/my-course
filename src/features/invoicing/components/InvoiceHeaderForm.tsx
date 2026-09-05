import type { InvoiceHeader } from '../types/invoice.types';
import type { InvoiceHeaderDTO } from '../types/invoice.schema';

interface InvoiceHeaderFormProps {
  value: InvoiceHeaderDTO;
  errors: Record<string, unknown>;
  onChange: (header: InvoiceHeader) => void;
}

const fieldClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none';

export function InvoiceHeaderForm({ value, errors, onChange }: InvoiceHeaderFormProps) {
  if (!value) return null;

  const update = <K extends keyof InvoiceHeader>(key: K, next: InvoiceHeader[K]): void => {
    onChange({ ...value, [key]: next });
  };

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <h2 className="text-lg font-semibold text-slate-800">Encabezado de la factura</h2>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">Correlativo</span>
        <input
          className={fieldClass}
          value={value.correlationCode}
          onChange={(e) => update('correlationCode', e.target.value)}
          aria-invalid={Boolean(errors['correlationCode'])}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">Moneda</span>
        <select
          className={fieldClass}
          value={value.currency}
          onChange={(e) => update('currency', e.target.value as InvoiceHeader['currency'])}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="COP">COP</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">Fecha de emisión</span>
        <input
          type="date"
          className={fieldClass}
          value={value.issueDate}
          onChange={(e) => update('issueDate', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">Fecha de vencimiento</span>
        <input
          type="date"
          className={fieldClass}
          value={value.dueDate}
          onChange={(e) => update('dueDate', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">Cliente (razón social)</span>
        <input
          className={fieldClass}
          value={value.customer.legalName}
          onChange={(e) =>
            update('customer', { ...value.customer, legalName: e.target.value })
          }
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">NIT/RUT cliente</span>
        <input
          className={fieldClass}
          value={value.customer.taxId}
          onChange={(e) => update('customer', { ...value.customer, taxId: e.target.value })}
        />
      </label>
    </section>
  );
}
