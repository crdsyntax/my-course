import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../types/product.types';

interface ProductCatalogContextValue {
  products: ReadonlyArray<Product>;
  addProduct: (product: Product) => void;
  getById: (id: string) => Product | undefined;
}

const ProductCatalogContext = createContext<ProductCatalogContextValue | null>(null);

const SEED_PRODUCTS: ReadonlyArray<Product> = [
  {
    id: 'seed-1',
    name: 'Consultoría técnica',
    description: 'Horas de consultoría especializada',
    sku: 'CONS-001',
    unitPrice: 120,
    taxRate: 0.19,
    taxCategory: 'VAT',
    currency: 'USD',
  },
  {
    id: 'seed-2',
    name: 'Licencia de software',
    description: 'Suscripción anual por usuario',
    sku: 'LIC-002',
    unitPrice: 240,
    taxRate: 0.19,
    taxCategory: 'VAT',
    currency: 'USD',
  },
  {
    id: 'seed-3',
    name: 'Exento de libro',
    description: 'Producto exento de IVA',
    sku: 'EXT-003',
    unitPrice: 50,
    taxRate: 0,
    taxCategory: 'EXEMPT',
    currency: 'USD',
  },
];

export function ProductCatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ReadonlyArray<Product>>(SEED_PRODUCTS);

  const addProduct = useCallback((product: Product): void => {
    setProducts((current) => [...current, product]);
  }, []);

  const getById = useCallback(
    (id: string): Product | undefined => products.find((product) => product.id === id),
    [products],
  );

  const value = useMemo<ProductCatalogContextValue>(
    () => ({ products, addProduct, getById }),
    [products, addProduct, getById],
  );

  return (
    <ProductCatalogContext.Provider value={value}>{children}</ProductCatalogContext.Provider>
  );
}

export function useProductCatalog(): ProductCatalogContextValue {
  const context = useContext(ProductCatalogContext);
  if (!context) {
    throw new Error('useProductCatalog must be used within a ProductCatalogProvider');
  }
  return context;
}
