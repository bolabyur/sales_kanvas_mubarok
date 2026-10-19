import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProdukOutSchema = z.object({
  kasbon_produk_id: z.number().int(),
  gudang_id: z.number().int(),
  tgl_keluar: z.string().datetime(),
});

export class CreateProdukOutDto extends createZodDto(createProdukOutSchema) {}