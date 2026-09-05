import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { productSchema, type ProductDTO } from '../types/product.schema';
import type { Product } from '../types/product.types';
import type { CurrencyCode, TaxCategory } from '../../invoicing/types/invoice.types';

export interface UseProductFormResult {
  form: UseFormReturn<ProductDTO>;
  submit: (product: Product) => void;
}

export function useProductForm(onCreated: (product: Product) => void): UseProductFormResult {
  const form = useForm<ProductDTO>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      sku: '',
      unitPrice: 0,
      taxRate: 0.19,
      taxCategory: 'VAT',
      currency: 'USD',
    },
    mode: 'onBlur',
  });

  const submit = (product: Product): void => {
    onCreated(product);
    form.reset({
      id: crypto.randomUUID(),
      name: '',
      description: '',
      sku: '',
      unitPrice: 0,
      taxRate: 0.19,
      taxCategory: 'VAT',
      currency: 'USD',
    });
  };

  return { form, submit };
}

export type { CurrencyCode, TaxCategory };
