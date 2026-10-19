import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// 1. Definisikan Schema
export const createOutletSchema = z.object({
  nama_toko: z.string().min(1, 'Nama toko wajib diisi'),
  alamat: z.string().optional(),
  tipe_harga_id: z.number().int(),
});

// 2. Buat Class DTO dari Schema (Ini yang dibaca Swagger)
export class CreateOutletDto extends createZodDto(createOutletSchema) {}
export class UpdateOutletDto extends createZodDto(createOutletSchema.partial()) {}