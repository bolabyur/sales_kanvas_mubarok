import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createGudangSchema = z.object({
  nama_gudang: z.string().min(1),
  tipe_gudang: z.enum(['Barang Jadi', 'Retur']),
});
export class CreateGudangDto extends createZodDto(createGudangSchema) {}
export class UpdateGudangDto extends createZodDto(createGudangSchema.partial()) {}