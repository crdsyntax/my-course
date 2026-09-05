import { z } from 'zod';

const currencyEnum = z.enum(['USD', 'EUR', 'COP']);
const taxCategoryEnum = z.enum(['VAT', 'EXEMPT', 'NON_TAXABLE']);

export const productSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1, 'El nombre del producto es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
    sku: z.string().min(1, 'El SKU es requerido'),
    unitPrice: z.number().nonnegative('El precio no puede ser negativo'),
    taxRate: z.number().min(0).max(1, 'La tasa de impuesto debe estar entre 0 y 1'),
    taxCategory: taxCategoryEnum,
    currency: currencyEnum,
  })
  .refine(
    (product) =>
      product.taxCategory === 'EXEMPT' || product.taxCategory === 'NON_TAXABLE'
        ? product.taxRate === 0
        : true,
    { message: 'Un producto exento o no gravable debe tener tasa 0', path: ['taxRate'] },
  );

export type ProductDTO = z.infer<typeof productSchema>;
