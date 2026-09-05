import { useMemo } from 'react';
import type { InvoiceItem } from '../types/invoice.types';
import {
  calculateInvoiceTotals,
  calculateLine,
  type CalculatedLine,
  type InvoiceTotals,
} from '../domain/invoiceCalculator';

export interface UseInvoiceCalculationsResult {
  readonly lines: ReadonlyArray<CalculatedLine>;
  readonly totals: InvoiceTotals;
}

/**
 * Reactive, side-effect-free facade over the pure tax calculator.
 * Recomputes only when the item collection reference changes.
 */
export function useInvoiceCalculations(
  items: ReadonlyArray<InvoiceItem>,
): UseInvoiceCalculationsResult {
  return useMemo<UseInvoiceCalculationsResult>(() => {
    const lines = items.map(calculateLine);
    const totals = calculateInvoiceTotals(items);
    return { lines, totals };
  }, [items]);
}
