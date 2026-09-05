import { z } from 'zod';

const currencyEnum = z.enum(['USD', 'EUR', 'COP']);
const taxCategoryEnum = z.enum(['VAT', 'EXEMPT', 'NON_TAXABLE']);
const invoiceStatusEnum = z.enum(['DRAFT', 'ISSUED', 'CANCELLED', 'PAID']);

export const issuerSchema = z.object({
  id: z.string().min(1, 'El ID del emisor es requerido'),
  legalName: z.string().min(1, 'La razón social es requerida'),
  taxId: z.string().min(1, 'El NIT/RUT es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
  email: z.string().email('Email del emisor inválido'),
});

export const customerSchema = z.object({
  id: z.string().min(1, 'El ID del cliente es requerido'),
  legalName: z.string().min(1, 'La razón social del cliente es requerida'),
  taxId: z.string().min(1, 'El NIT/RUT del cliente es requerido'),
  address: z.string().min(1, 'La dirección del cliente es requerida'),
  email: z.string().email('Email del cliente inválido'),
});

export const invoiceItemSchema = z
  .object({
    id: z.string().min(1),
    productId: z.string().optional(),
    description: z.string().min(1, 'La descripción del ítem es requerida'),
    quantity: z.number().positive('La cantidad debe ser mayor a 0'),
    unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
    discountRate: z.number().min(0).max(1, 'El descuento debe estar entre 0 y 1'),
    taxRate: z.number().min(0).max(1, 'La tasa de impuesto debe estar entre 0 y 1'),
    taxCategory: taxCategoryEnum,
  })
  .refine(
    (item) =>
      item.taxCategory === 'EXEMPT' || item.taxCategory === 'NON_TAXABLE'
        ? item.taxRate === 0
        : true,
    { message: 'Un ítem exento o no gravable debe tener tasa de impuesto 0', path: ['taxRate'] },
  );

export const invoiceHeaderSchema = z
  .object({
    issuer: issuerSchema,
    customer: customerSchema,
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de emisión inválida'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de vencimiento inválida'),
    correlationCode: z.string().min(1, 'El correlativo es requerido'),
    currency: currencyEnum,
  })
  .refine((header) => header.dueDate >= header.issueDate, {
    message: 'La fecha de vencimiento no puede ser anterior a la de emisión',
    path: ['dueDate'],
  });

export const invoiceDraftSchema = z.object({
  header: invoiceHeaderSchema,
  items: z.array(invoiceItemSchema).min(1, 'Debe incluir al menos un ítem'),
});

export const invoiceSchema = invoiceDraftSchema.extend({
  id: z.string().min(1),
  status: invoiceStatusEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type IssuerDTO = z.infer<typeof issuerSchema>;
export type CustomerDTO = z.infer<typeof customerSchema>;
export type InvoiceItemDTO = z.infer<typeof invoiceItemSchema>;
export type InvoiceHeaderDTO = z.infer<typeof invoiceHeaderSchema>;
export type InvoiceDraftDTO = z.infer<typeof invoiceDraftSchema>;
export type InvoiceDTO = z.infer<typeof invoiceSchema>;
