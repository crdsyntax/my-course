import { useInvoiceCalculations } from '../hooks/useInvoiceCalculations';
import type { CurrencyCode, InvoiceItem } from '../types/invoice.types';
import type { Product } from '../../products';
import { formatCurrency } from '../utils/format';

interface InvoiceItemTableProps {
  items: ReadonlyArray<InvoiceItem>;
  currency: CurrencyCode;
  products?: ReadonlyArray<Product>;
  onItemsChange: (items: InvoiceItem[]) => void;
}

export function InvoiceItemTable({ items, currency, products, onItemsChange }: InvoiceItemTableProps) {
  const { lines } = useInvoiceCalculations(items);

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No hay ítems registrados.</p>;
  }

  const updateItem = (index: number, patch: Partial<InvoiceItem>): void => {
    onItemsChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index: number): void => {
    if (items.length <= 1) return;
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const addItem = (): void => {
    onItemsChange([
      ...items,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountRate: 0,
        taxRate: 0.19,
        taxCategory: 'VAT',
      },
    ]);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <th className="px-2 py-2">Producto</th>
            <th className="px-2 py-2">Descripción</th>
            <th className="px-2 py-2">Cant.</th>
            <th className="px-2 py-2">Precio</th>
            <th className="px-2 py-2">Desc.</th>
            <th className="px-2 py-2">Imp.</th>
            <th className="px-2 py-2">Total</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const line = lines[index];
            return (
          <tr key={item.id} className="border-t border-slate-200">
            <td className="px-2 py-2">
              <select
                className="w-40 rounded border border-slate-300 px-2 py-1"
                value={item.productId ?? ''}
                onChange={(e) => {
                  const picked = products?.find((product) => product.id === e.target.value);
                  if (!picked) {
                    updateItem(index, { productId: undefined });
                    return;
                  }
                  updateItem(index, {
                    productId: picked.id,
                    description: picked.name,
                    unitPrice: picked.unitPrice,
                    taxRate: picked.taxRate,
                    taxCategory: picked.taxCategory,
                  });
                }}
              >
                <option value="">Manual</option>
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </td>
            <td className="px-2 py-2">
              <input
                className="w-full rounded border border-slate-300 px-2 py-1"
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
              />
            </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="w-16 rounded border border-slate-300 px-2 py-1"
                    value={item.quantity}
                    min={1}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="w-24 rounded border border-slate-300 px-2 py-1"
                    value={item.unitPrice}
                    min={0}
                    onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="w-16 rounded border border-slate-300 px-2 py-1"
                    value={item.discountRate}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(e) => updateItem(index, { discountRate: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="w-16 rounded border border-slate-300 px-2 py-1"
                    value={item.taxRate}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(e) => updateItem(index, { taxRate: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2 font-medium">
                  {line ? formatCurrency(line.lineTotal, currency) : '—'}
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    className="text-rose-600 hover:text-rose-800"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button
        type="button"
        className="mt-3 rounded-md border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
        onClick={addItem}
      >
        + Agregar ítem
      </button>
    </div>
  );
}
