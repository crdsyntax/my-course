import { useProductCatalog } from '../state/ProductCatalogContext';
import { formatCurrency } from '../../invoicing/utils/format';

export function ProductList() {
  const { products } = useProductCatalog();

  if (products.length === 0) {
    return <p className="text-sm text-slate-500">No hay productos registrados.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2">Descripción</th>
            <th className="px-3 py-2">Precio</th>
            <th className="px-3 py-2">Imp.</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-slate-200">
              <td className="px-3 py-2 font-mono text-xs">{product.sku}</td>
              <td className="px-3 py-2 font-medium">{product.name}</td>
              <td className="px-3 py-2 text-slate-500">{product.description}</td>
              <td className="px-3 py-2">{formatCurrency(product.unitPrice, product.currency)}</td>
              <td className="px-3 py-2">
                {product.taxCategory === 'VAT' ? `${(product.taxRate * 100).toFixed(0)}%` : 'Ex.'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
