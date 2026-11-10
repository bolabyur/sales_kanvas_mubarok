import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ReceiveDetailSchema = z.object({
  detail_id: z.number().int().positive(),
  qty_diterima: z.number().int().min(1),
  kondisi: z.enum(['BAGUS', 'RUSAK', 'EXPIRED']),
});

export const ReceiveKanvasReturnSchema = z.object({
  details: z.array(ReceiveDetailSchema).min(1),
});

export class ReceiveKanvasReturnDto extends createZodDto(ReceiveKanvasReturnSchema) {}