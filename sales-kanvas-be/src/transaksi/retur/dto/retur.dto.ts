import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createReturSchema = z.object({
  outlet_id: z.number().int(),
  invoice_outlet_id: z.number().int().optional(),
  gudang_retur_id: z.number().int(),
  total_nilai_retur: z.number().min(0),
  details: z.array(z.object({
    produk_id: z.number().int(),
    batch_id: z.number().int(),
    qty: z.number().int().min(1),
    alasan_retur: z.string().min(1),
  })).min(1, 'Minimal 1 barang diretur'),
});

export class CreateReturDto extends createZodDto(createReturSchema) {}