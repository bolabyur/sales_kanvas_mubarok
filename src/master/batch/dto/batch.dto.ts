import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createBatchSchema = z.object({
  produk_id: z.number().int(),
  no_batch: z.string().min(1, 'Nomor batch wajib diisi'),
  expired_date: z.string().datetime({ message: 'Format tanggal harus ISO String (YYYY-MM-DDTHH:mm:ss.sssZ)' }),
  stok_gudang: z.number().int().min(0, 'Stok tidak boleh minus'),
});

export const updateBatchSchema = createBatchSchema.partial();

export class CreateBatchDto extends createZodDto(createBatchSchema) {}
export class UpdateBatchDto extends createZodDto(updateBatchSchema) {}