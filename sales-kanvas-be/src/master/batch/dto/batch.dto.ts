import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createBatchSchema = z.object({
  produk_id: z.number().int(),
  no_batch: z.string().min(1),
  expired_date: z.string(), 
  stok_gudang: z.number().int().min(0).optional(),
});

export const updateBatchSchema = createBatchSchema.partial();
export class CreateBatchDto extends createZodDto(createBatchSchema) {}
export class UpdateBatchDto extends createZodDto(updateBatchSchema) {}

export const adjustStockSchema = z.object({
  qty_delta: z.number().int().refine(val => val !== 0, 'Qty koreksi tidak boleh 0'),
  alasan: z.string().min(5, 'Alasan minimal 5 karakter'),
});
export class AdjustStockDto extends createZodDto(adjustStockSchema) {}