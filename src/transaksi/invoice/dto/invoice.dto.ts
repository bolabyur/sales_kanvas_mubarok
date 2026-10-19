import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  outlet_id: z.number().int(),
  sales_kanvas_plan_id: z.number().int(),
  tipe_pembayaran: z.enum(['Tunai', 'Kredit', 'TOP']),
  tgl_invoice: z.string().datetime(),
  details: z.array(
    z.object({
      produk_id: z.number().int(),
      batch_id: z.number().int(),
      qty: z.number().int().min(1, 'Minimal 1 barang'),
      harga_satuan: z.number().min(0),
    })
  ).min(1, 'Minimal harus ada 1 barang yang dibeli'),
});

export class CreateInvoiceDto extends createZodDto(createInvoiceSchema) {}