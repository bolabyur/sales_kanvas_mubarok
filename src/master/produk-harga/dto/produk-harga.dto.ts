import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProdukHargaSchema = z.object({
  produk_id: z.number().int(),
  tipe_harga_id: z.number().int(),
  harga: z.number().min(0),
});
export class CreateProdukHargaDto extends createZodDto(createProdukHargaSchema) {}
export class UpdateProdukHargaDto extends createZodDto(createProdukHargaSchema.partial()) {}