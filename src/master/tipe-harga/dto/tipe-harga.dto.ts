import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTipeHargaSchema = z.object({
  nama_tipe: z.string().min(1),
});
export class CreateTipeHargaDto extends createZodDto(createTipeHargaSchema) {}
export class UpdateTipeHargaDto extends createZodDto(createTipeHargaSchema.partial()) {}