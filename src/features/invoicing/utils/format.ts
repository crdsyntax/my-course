import type { CurrencyCode } from '../types/invoice.types';

const formatters = new Map<CurrencyCode, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(amount);
}
