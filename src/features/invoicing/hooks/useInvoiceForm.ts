import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import {
  invoiceDraftSchema,
  type InvoiceDraftDTO,
} from '../types/invoice.schema';
import type { InvoiceDraft, InvoiceItem } from '../types/invoice.types';

const EMPTY_ITEM: InvoiceItem = {
  id: crypto.randomUUID(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  discountRate: 0,
  taxRate: 0.19,
  taxCategory: 'VAT',
};

const DEFAULT_DRAFT: InvoiceDraft = {
  header: {
    issuer: { id: '', legalName: '', taxId: '', address: '', email: '' },
    customer: { id: '', legalName: '', taxId: '', address: '', email: '' },
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    correlationCode: '',
    currency: 'USD',
  },
  items: [{ ...EMPTY_ITEM }],
};

export interface UseInvoiceFormResult {
  form: UseFormReturn<InvoiceDraftDTO>;
  addItem: () => void;
  removeItem: (index: number) => void;
  resetDraft: () => void;
}

export function useInvoiceForm(
  initialDraft: InvoiceDraft = DEFAULT_DRAFT,
): UseInvoiceFormResult {
  const form = useForm<InvoiceDraftDTO>({
    resolver: zodResolver(invoiceDraftSchema),
    defaultValues: initialDraft,
    mode: 'onBlur',
  });

  const addItem = (): void => {
    const current = form.getValues('items');
    form.setValue('items', [...current, { ...EMPTY_ITEM, id: crypto.randomUUID() }], {
      shouldValidate: true,
    });
  };

  const removeItem = (index: number): void => {
    const current = form.getValues('items');
    if (current.length <= 1) return;
    form.setValue(
      'items',
      current.filter((_, i) => i !== index),
      { shouldValidate: true },
    );
  };

  const resetDraft = (): void => {
    form.reset(DEFAULT_DRAFT);
  };

  return { form, addItem, removeItem, resetDraft };
}
