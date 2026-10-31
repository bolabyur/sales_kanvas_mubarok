import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const InvoiceDetailSchema = z.object({
  produk_id: z.number().int().positive(),
  // batch_id dihapus — BE akan alokasi FEFO otomatis
  qty: z.number().int().positive(),
});

const CreateInvoiceSchema = z.object({
  outlet_id: z.number().int().positive(),
  sales_kanvas_plan_id: z.number().int().positive(),
  tipe_pembayaran: z.enum(['Tunai', 'Kredit']),
  tgl_invoice: z.string().datetime(),
  details: z.array(InvoiceDetailSchema).min(1),
});

export class CreateInvoiceDto extends createZodDto(CreateInvoiceSchema) {}