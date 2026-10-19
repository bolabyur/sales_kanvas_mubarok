import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createSettlementSchema = z.object({
  sales_kanvas_plan_id: z.number().int(),
  uang_fisik_diterima: z.number().min(0, 'Uang fisik tidak boleh minus'),
  approved_by: z.number().int(),
});

export class CreateSettlementDto extends createZodDto(createSettlementSchema) {}