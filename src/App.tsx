import { InvoiceForm } from './features/invoicing';
import { ProductCatalogProvider } from './features/products';

export default function App() {
  return (
    <ProductCatalogProvider>
      <main className="min-h-screen bg-slate-50">
        <InvoiceForm />
      </main>
    </ProductCatalogProvider>
  );
}
