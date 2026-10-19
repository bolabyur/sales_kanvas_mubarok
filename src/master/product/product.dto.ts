import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const id = z.number().int().positive();

const productSchema = z
  .object({
    name: z.string().min(1),
    code: z.string().min(1),
    product_brand_id: id,
    product_type_id: id,
    jenang_flavor_id: id.optional().nullable(),
    isian: z.number().int().optional().nullable(),
    unit_id: id.optional().nullable(),
    sale_report_group_id: id,
    supplier_id: id,
    weight: z.number().int().optional().nullable(),
    is_active: z.boolean().default(true),
    barcode: z.string().min(1),
    type_price: z.enum(['FIXED', 'PERSENTASE']),
    hpp: z.number().nonnegative().optional().nullable(),
    expired_count: z.number().int().optional().nullable(),
  })
  .strict();

export class CreateProductDto extends createZodDto(productSchema) {}
export class UpdateProductDto extends createZodDto(productSchema.partial()) {}
