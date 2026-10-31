import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const baseProductSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  code: z.string().min(1, 'Kode wajib diisi'),
  barcode: z.string().min(1, 'Barcode wajib diisi'),
  product_brand_id: z.number().int(),
  product_type_id: z.number().int(),
  sale_report_group_id: z.number().int(),
  supplier_id: z.number().int(),
  jenang_flavor_id: z.number().int().nullable().optional(),
  unit_id: z.number().int().nullable().optional(),
  isian: z.number().int().nullable().optional(),
  weight: z.number().int().nullable().optional(),
  expired_count: z.number().int().nullable().optional(),
  // PERBAIKAN: Tambahkan 'Retail' agar sesuai dengan data di database Anda
  type_price: z.enum(['FIXED', 'PERSENTASE', 'Retail']), 
  hpp: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
  // PERBAIKAN: Terima array prices dari frontend
  prices: z.array(z.object({
    tipe_harga_id: z.number().int(),
    harga: z.number()
  })).optional()
});

export const createProductSchema = baseProductSchema;
export class CreateProductDto extends createZodDto(createProductSchema) {}

export const updateProductSchema = baseProductSchema.partial();
export class UpdateProductDto extends createZodDto(updateProductSchema) {}