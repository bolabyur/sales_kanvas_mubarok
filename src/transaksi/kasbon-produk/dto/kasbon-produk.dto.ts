import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createKasbonProdukSchema = z.object({
  sales_kanvas_plan_id: z.number().int(),
  details: z.array(
    z.object({
      produk_id: z.number().int(),
      batch_id: z.number().int(),
      qty_bawa: z.number().int().min(1),
    })
  ).min(1),
});

export class CreateKasbonProdukDto extends createZodDto(createKasbonProdukSchema) {}