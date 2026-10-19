import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPlanOutletSchema = z.object({
  sales_kanvas_plan_id: z.number().int(),
  outlet_id: z.number().int(),
  urutan_kunjungan: z.number().int(),
});

export class CreatePlanOutletDto extends createZodDto(createPlanOutletSchema) {}