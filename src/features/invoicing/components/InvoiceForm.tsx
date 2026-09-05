import { useState } from 'react';
import type { Invoice, InvoiceItem } from '../types/invoice.types';
import { useInvoiceForm } from '../hooks/useInvoiceForm';
import { useCreateInvoice } from '../hooks/useInvoiceMutations';
import { buildInvoiceFromDraft } from '../utils/buildInvoice';
import { useProductCatalog } from '../../products';
import { ProductManager } from '../../products';
import { InvoiceHeaderForm } from './InvoiceHeaderForm';
import { InvoiceItemTable } from './InvoiceItemTable';
import { InvoiceSummary } from './InvoiceSummary';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { InvoicePdfViewer } from './InvoicePdfViewer';
import { InvoicePrintModal } from './InvoicePrintModal';

export function InvoiceForm() {
  const { form } = useInvoiceForm();
  const [items, setItems] = useState<InvoiceItem[]>(form.getValues('items'));
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const createMutation = useCreateInvoice();
  const { products } = useProductCatalog();

  const values = form.watch();
  const currency = values.header?.currency ?? 'USD';

  const handleSubmit = form.handleSubmit((draft) => {
    setPreviewInvoice(buildInvoiceFromDraft(draft));
    createMutation.mutate(draft);
  });

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Facturación Digital</h1>
        <InvoiceStatusBadge status="DRAFT" />
      </header>

      <InvoiceHeaderForm
        value={values.header}
        errors={form.formState.errors as Record<string, unknown>}
        onChange={(header) => form.setValue('header', header, { shouldValidate: true })}
      />

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Catálogo de productos</h2>
        <ProductManager />
      </section>

      <InvoiceItemTable
        items={items}
        currency={currency}
        products={products}
        onItemsChange={setItems}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InvoicePdfViewer pdfBlob={null} correlationCode={values.header?.correlationCode ?? ''} />
        <InvoiceSummary items={items} currency={currency} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Guardando…' : 'Guardar y emitir'}
        </button>
        {createMutation.isError && (
          <p className="text-sm text-rose-600">Error al guardar la factura.</p>
        )}
      </div>

      {previewInvoice && (
        <InvoicePrintModal
          header={previewInvoice.header}
          items={previewInvoice.items}
          status={previewInvoice.status}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </form>
  );
}
