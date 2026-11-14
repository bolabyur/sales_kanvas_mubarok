import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createSettlementSchema = z
  .object({
    sales_kanvas_plan_id: z.number().int().positive(),
    uang_fisik_diterima: z.number().min(0, 'Uang fisik tidak boleh minus'),
  })
  .strip();

export class CreateSettlementDto extends createZodDto(createSettlementSchema) {}