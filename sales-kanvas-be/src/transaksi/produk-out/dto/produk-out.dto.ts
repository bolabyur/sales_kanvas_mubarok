import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProdukOutSchema = z.object({
  kasbon_produk_id: z.number().int().positive(),
  gudang_id: z.number().int().positive(),
  tgl_keluar: z.string().datetime(),
  tipe_sumber: z.enum(['KE_SALES_KANVAS', 'KE_PENJUALAN', 'KE_SALES_COUNTER', 'KE_SHOWROOM']),
});

export class CreateProdukOutDto extends createZodDto(createProdukOutSchema) {}