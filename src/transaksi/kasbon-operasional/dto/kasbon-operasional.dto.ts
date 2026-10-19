import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createKasbonOperasionalSchema = z.object({
  sales_kanvas_plan_id: z.number().int(),
  nominal_kasbon: z.number().min(0),
  details: z.array(
    z.object({
      nama_pengeluaran: z.string().min(1),
      nominal: z.number().min(1),
      foto_bukti: z.string().url('Foto bukti harus berupa URL yang valid'),
    })
  ).min(1, 'Minimal 1 pengeluaran harus dicatat'),
});

export class CreateKasbonOperasionalDto extends createZodDto(createKasbonOperasionalSchema) {}