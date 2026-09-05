import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { InvoiceDraft } from '../types/invoice.types';

interface InvoiceDraftContextValue {
  draft: InvoiceDraft;
  setDraft: (draft: InvoiceDraft) => void;
  clearDraft: () => void;
}

const InvoiceDraftContext = createContext<InvoiceDraftContextValue | null>(null);

const EMPTY_DRAFT: InvoiceDraft = {
  header: {
    issuer: { id: '', legalName: '', taxId: '', address: '', email: '' },
    customer: { id: '', legalName: '', taxId: '', address: '', email: '' },
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    correlationCode: '',
    currency: 'USD',
  },
  items: [],
};

export function InvoiceDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<InvoiceDraft>(EMPTY_DRAFT);

  const value = useMemo<InvoiceDraftContextValue>(
    () => ({
      draft,
      setDraft,
      clearDraft: () => setDraft(EMPTY_DRAFT),
    }),
    [draft],
  );

  return <InvoiceDraftContext.Provider value={value}>{children}</InvoiceDraftContext.Provider>;
}

export function useInvoiceDraft(): InvoiceDraftContextValue {
  const context = useContext(InvoiceDraftContext);
  if (!context) {
    throw new Error('useInvoiceDraft must be used within an InvoiceDraftProvider');
  }
  return context;
}
