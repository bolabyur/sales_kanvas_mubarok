import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createKasbonProdukSchema = z.object({
  sales_kanvas_plan_id: z.number().int().positive(),
  
  details: z.array(
    z.object({
      produk_id: z.number().int().positive(),
      batch_id: z.number().int().positive(),
      qty_bawa: z.number().int().min(1),
    })
  ).min(1, 'Minimal 1 barang harus diajukan'),

  operasional: z.array(
    z.object({
      nama_pengeluaran: z.string().min(1),
      nominal: z.number().min(0),
      foto_bukti: z.string().min(1), 
    })
  ).optional(),
});

export class CreateKasbonProdukDto extends createZodDto(createKasbonProdukSchema) {}