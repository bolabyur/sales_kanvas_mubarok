import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProdukInSchema = z.object({
  sales_kanvas_plan_id: z.number().int(),
  gudang_id: z.number().int(),
  tgl_masuk: z.string().datetime(),
  details: z.array(
    z.object({
      produk_id: z.number().int(),
      batch_id: z.number().int(),
      qty_sisa: z.number().int().min(1, 'Qty minimal 1'),
      kondisi: z.enum(['Bagus', 'Rusak']),
    })
  ).min(1, 'Minimal 1 barang harus dikembalikan'),
});

export class CreateProdukInDto extends createZodDto(createProdukInSchema) {}