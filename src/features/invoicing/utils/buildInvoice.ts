import type { Invoice, InvoiceDraft } from '../types/invoice.types';

export function buildInvoiceFromDraft(draft: InvoiceDraft): Invoice {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    header: draft.header,
    items: draft.items,
    status: 'ISSUED',
    createdAt: now,
    updatedAt: now,
  };
}
