import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProdukInSchema = z.object({
  sales_kanvas_plan_id: z.number().int().positive(),
  gudang_id: z.number().int().positive(),
  tgl_masuk: z.string().datetime(),
  tipe_sumber: z.enum(['DARI_PRODUKSI', 'DARI_SALES_KANVAS', 'DARI_RETUR', 'DARI_SHOWROOM']),
  details: z.array(
    z.object({
      produk_id: z.number().int().positive(),
      no_batch: z.string().min(1, 'No Batch wajib diisi'),
      expired_date: z.string().datetime(),
      qty_sisa: z.number().int().min(1, 'Qty minimal 1'),
      kondisi: z.enum(['Bagus', 'Rusak']),
    })
  ).min(1, 'Minimal 1 barang harus diinputkan'),
});

export class CreateProdukInDto extends createZodDto(createProdukInSchema) {}