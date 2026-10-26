import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProdukOutSchema = z.object({
  kasbon_produk_id: z.number().int().positive(),
  gudang_id: z.number().int().positive(),
  tgl_keluar: z.string().datetime(),
  source_type: z.enum(['TOKO', 'SALES_COUNTER', 'SALES_KANVAS']), 
});

export class CreateProdukOutDto extends createZodDto(createProdukOutSchema) {}