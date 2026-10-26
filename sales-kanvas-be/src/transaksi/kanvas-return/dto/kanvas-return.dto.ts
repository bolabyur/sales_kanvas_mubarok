import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createKanvasReturnSchema = z.object({
  sales_kanvas_plan_id: z.number().int().positive(),
  gudang_tujuan_id: z.number().int().positive(),
  tgl_retur: z.string().datetime(),
  details: z.array(
    z.object({
      batch_id: z.number().int().positive(),
      produk_id: z.number().int().positive(),
      qty: z.number().int().min(1),
      kondisi: z.enum(['BAGUS', 'RUSAK', 'EXPIRED']),
      alasan: z.string().optional(),
    })
  ).min(1, 'Minimal 1 barang harus diretur'),
});

export class CreateKanvasReturnDto extends createZodDto(createKanvasReturnSchema) {}