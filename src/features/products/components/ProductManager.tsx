import { ProductForm } from './ProductForm';
import { ProductList } from './ProductList';

export function ProductManager() {
  return (
    <section className="space-y-4">
      <ProductForm />
      <ProductList />
    </section>
  );
}
