import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '../services/invoice.api';
import type { InvoiceDraft, Invoice } from '../types/invoice.types';
import { fetchAndDownloadPdf } from '../services/invoice-pdf.service';

const INVOICES_KEY = ['invoices'] as const;

export function useInvoiceList() {
  return useQuery({
    queryKey: INVOICES_KEY,
    queryFn: () => invoiceApi.list(),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: InvoiceDraft) => invoiceApi.create(draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

export function useIssueInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.issue(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.cancel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: async (invoice: Invoice) => {
      const blob = await invoiceApi.downloadPdf(invoice.id);
      await fetchAndDownloadPdf(blob, `invoice-${invoice.header.correlationCode}`);
      return blob;
    },
  });
}
