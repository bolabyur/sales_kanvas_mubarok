import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createDestructionSchema = z.object({
  gudang_id: z.number().int().positive(),
  tgl_destruction: z.string().datetime(),
  alasan: z.string().min(1),
  details: z.array(
    z.object({
      batch_id: z.number().int().positive(),
      produk_id: z.number().int().positive(),
      qty_dimusnahkan: z.number().int().min(1),
    })
  ).min(1, 'Minimal 1 barang harus dimusnahkan'),
});

export class CreateDestructionDto extends createZodDto(createDestructionSchema) {}