export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED' | 'PAID';

export type TaxCategory = 'VAT' | 'EXEMPT' | 'NON_TAXABLE';

export type CurrencyCode = 'USD' | 'EUR' | 'COP';

export interface Issuer {
  readonly id: string;
  readonly legalName: string;
  readonly taxId: string;
  readonly address: string;
  readonly email: string;
}

export interface Customer {
  readonly id: string;
  readonly legalName: string;
  readonly taxId: string;
  readonly address: string;
  readonly email: string;
}

export interface InvoiceItem {
  readonly id: string;
  /** Links the line to a catalog product when picked from the catalog. */
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  /** Fractional discount per line, range [0, 1]. */
  discountRate: number;
  /** Effective tax rate as a fraction, e.g. 0.19 for 19%. */
  taxRate: number;
  taxCategory: TaxCategory;
}

export interface InvoiceHeader {
  issuer: Issuer;
  customer: Customer;
  /** ISO-8601 date string (YYYY-MM-DD). */
  issueDate: string;
  dueDate: string;
  /** Sequential correlative assigned by the issuing authority. */
  correlationCode: string;
  currency: CurrencyCode;
}

export interface Invoice {
  readonly id: string;
  header: InvoiceHeader;
  items: InvoiceItem[];
  status: InvoiceStatus;
  readonly createdAt: string;
  updatedAt: string;
}

/** Client-side draft shape used by the form before persistence. */
export interface InvoiceDraft {
  header: InvoiceHeader;
  items: InvoiceItem[];
}
