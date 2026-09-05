import type { CurrencyCode, TaxCategory } from '../../invoicing/types/invoice.types';

export interface Product {
  readonly id: string;
  name: string;
  description: string;
  sku: string;
  unitPrice: number;
  taxRate: number;
  taxCategory: TaxCategory;
  currency: CurrencyCode;
}
