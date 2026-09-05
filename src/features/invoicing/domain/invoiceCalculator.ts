import type { InvoiceItem, TaxCategory } from '../types/invoice.types';

export interface CalculatedLine {
  readonly item: InvoiceItem;
  readonly gross: number;
  readonly discountAmount: number;
  readonly net: number;
  readonly taxableBase: number;
  readonly taxAmount: number;
  readonly lineTotal: number;
}

export interface TaxBreakdownEntry {
  readonly taxRate: number;
  readonly taxCategory: TaxCategory;
  readonly taxableBase: number;
  readonly taxAmount: number;
}

export interface InvoiceTotals {
  readonly subtotal: number;
  readonly totalDiscount: number;
  readonly taxableBase: number;
  readonly taxBreakdown: ReadonlyArray<TaxBreakdownEntry>;
  readonly totalTax: number;
  readonly grandTotal: number;
}

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const isTaxable = (category: TaxCategory): boolean =>
  category === 'VAT';

export function calculateLine(item: InvoiceItem): CalculatedLine {
  const gross = item.quantity * item.unitPrice;
  const discountAmount = gross * item.discountRate;
  const net = gross - discountAmount;
  const taxable = isTaxable(item.taxCategory);
  const taxableBase = taxable ? net : 0;
  const taxAmount = round2(taxableBase * item.taxRate);
  return {
    item,
    gross: round2(gross),
    discountAmount: round2(discountAmount),
    net: round2(net),
    taxableBase: round2(taxableBase),
    taxAmount,
    lineTotal: round2(net + taxAmount),
  };
}

export function calculateInvoiceTotals(items: ReadonlyArray<InvoiceItem>): InvoiceTotals {
  const lines = items.map(calculateLine);

  const subtotal = round2(lines.reduce((acc, line) => acc + line.gross, 0));
  const totalDiscount = round2(lines.reduce((acc, line) => acc + line.discountAmount, 0));
  const taxableBase = round2(lines.reduce((acc, line) => acc + line.taxableBase, 0));
  const totalTax = round2(lines.reduce((acc, line) => acc + line.taxAmount, 0));
  const grandTotal = round2(lines.reduce((acc, line) => acc + line.lineTotal, 0));

  const breakdownMap = new Map<string, TaxBreakdownEntry>();
  for (const line of lines) {
    if (line.taxableBase === 0) continue;
    const key = `${line.item.taxCategory}:${line.item.taxRate}`;
    const existing = breakdownMap.get(key);
    if (existing) {
      breakdownMap.set(key, {
        ...existing,
        taxableBase: round2(existing.taxableBase + line.taxableBase),
        taxAmount: round2(existing.taxAmount + line.taxAmount),
      });
    } else {
      breakdownMap.set(key, {
        taxRate: line.item.taxRate,
        taxCategory: line.item.taxCategory,
        taxableBase: line.taxableBase,
        taxAmount: line.taxAmount,
      });
    }
  }

  return {
    subtotal,
    totalDiscount,
    taxableBase,
    taxBreakdown: [...breakdownMap.values()],
    totalTax,
    grandTotal,
  };
}
