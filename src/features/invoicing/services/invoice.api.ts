import type {
  Invoice,
  InvoiceDraft,
} from '../types/invoice.types';
import type { InvoiceDTO } from '../types/invoice.schema';

const API_BASE_URL = import.meta.env.VITE_INVOICING_API_URL ?? '/api';

type FetchInit = Omit<RequestInit, 'body'> & { body?: unknown };

async function request<TResponse>(path: string, init?: FetchInit): Promise<TResponse> {
  const hasBody = init?.body !== undefined;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: init?.method,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: init?.cache,
    credentials: init?.credentials,
    mode: init?.mode,
    body: hasBody ? JSON.stringify(init.body) : null,
  });

  if (!response.ok) {
    throw new Error(`Invoice API error ${response.status}: ${await response.text()}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }
  return (await response.json()) as TResponse;
}

export const invoiceApi = {
  create(draft: InvoiceDraft): Promise<InvoiceDTO> {
    return request<InvoiceDTO>('/invoices', { method: 'POST', body: draft });
  },
  list(): Promise<ReadonlyArray<InvoiceDTO>> {
    return request<ReadonlyArray<InvoiceDTO>>('/invoices');
  },
  getById(id: string): Promise<InvoiceDTO> {
    return request<InvoiceDTO>(`/invoices/${encodeURIComponent(id)}`);
  },
  cancel(id: string): Promise<InvoiceDTO> {
    return request<InvoiceDTO>(`/invoices/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
    });
  },
  issue(id: string): Promise<InvoiceDTO> {
    return request<InvoiceDTO>(`/invoices/${encodeURIComponent(id)}/issue`, {
      method: 'PATCH',
    });
  },
  async downloadPdf(id: string): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/invoices/${encodeURIComponent(id)}/pdf`,
      { headers: { Accept: 'application/pdf' } },
    );
    if (!response.ok) {
      throw new Error(`Invoice PDF error ${response.status}`);
    }
    return response.blob();
  },
} satisfies Record<string, (...args: never[]) => Promise<unknown>>;

export type InvoiceApi = typeof invoiceApi;

export type { Invoice, InvoiceDraft };
