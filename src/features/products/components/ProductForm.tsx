import { useProductCatalog } from '../state/ProductCatalogContext';
import { useProductForm } from '../hooks/useProductForm';
import type { CurrencyCode, TaxCategory } from '../../invoicing/types/invoice.types';

const fieldClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none';

export function ProductForm() {
  const { addProduct } = useProductCatalog();
  const { form, submit } = useProductForm((product) => addProduct(product));

  const currency = form.watch('currency') as CurrencyCode;
  const taxCategory = form.watch('taxCategory') as TaxCategory;

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"
    >
      <h2 className="md:col-span-2 text-base font-semibold text-slate-800">Registrar producto</h2>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">Nombre</span>
        <input className={fieldClass} {...form.register('name')} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">SKU</span>
        <input className={fieldClass} {...form.register('sku')} />
      </label>

      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="text-xs font-medium text-slate-600">Descripción</span>
        <input className={fieldClass} {...form.register('description')} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">Precio unitario</span>
        <input type="number" step="0.01" className={fieldClass} {...form.register('unitPrice', { valueAsNumber: true })} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">Tasa de impuesto</span>
        <input
          type="number"
          step="0.01"
          min={0}
          max={1}
          className={fieldClass}
          {...form.register('taxRate', { valueAsNumber: true })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">Categoría</span>
        <select className={fieldClass} value={taxCategory} {...form.register('taxCategory')}>
          <option value="VAT">Gravado (IVA)</option>
          <option value="EXEMPT">Exento</option>
          <option value="NON_TAXABLE">No gravable</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">Moneda</span>
        <select className={fieldClass} value={currency} {...form.register('currency')}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="COP">COP</option>
        </select>
      </label>

      <button
        type="submit"
        className="md:col-span-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Agregar producto
      </button>
    </form>
  );
}
