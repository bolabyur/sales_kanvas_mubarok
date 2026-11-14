import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProdukInSchema = z.object({
  sales_kanvas_plan_id: z.number().int().positive().optional().nullable(),
  gudang_id: z.number().int().positive(),
  tgl_masuk: z.string().datetime(),
  // 🔥 Hanya 3 sumber sesuai revisi
  source_type: z.enum(['PRODUKSI', 'SALES_KANVAS', 'TOKO']), 
  details: z.array(
    z.object({
      produk_id: z.number().int().positive(),
      no_batch: z.string().min(1, 'No Batch wajib diisi'),
      expired_date: z.string().datetime(),
      qty_sisa: z.number().int().min(1, 'Qty minimal 1'),
      kondisi: z.enum(['Bagus', 'Rusak']),
    })
  ).min(1, 'Minimal 1 barang harus diinputkan'),
}).superRefine((data, ctx) => {
  // Validasi: Jika SALES_KANVAS, plan_id wajib diisi
  if (data.source_type === 'SALES_KANVAS' && !data.sales_kanvas_plan_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'sales_kanvas_plan_id wajib diisi jika sumber adalah SALES_KANVAS',
      path: ['sales_kanvas_plan_id'],
    });
  }
});

export class CreateProdukInDto extends createZodDto(createProdukInSchema) {}