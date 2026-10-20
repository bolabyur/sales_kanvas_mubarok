import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PLAN_STATUS = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  ON_TRIP: 'On-Trip',
  SETTLED: 'Settled',
  BATAL: 'Batal', 
};

export const createPlanSchema = z.object({
  tgl_invoice: z.string().datetime(),
  tgl_pergi_kanvas: z.string().datetime(),
  tgl_kembali_kanvas: z.string().datetime().nullable().optional(),
  market_area_id: z.number().int(),
  vehicle_id: z.number().int(),
  note: z.string().optional(),
  salesKanvasPersonil: z.array(
    z.object({
      employee_id: z.number().int(),
      position: z.string(),
    })
  ).min(1),
  salesKanvasPlanDetail: z.array(
    z.object({
      product_id: z.number().int(),
      qty: z.number().int().min(1),
    })
  ).min(1),
  salesKanvasKasbonMaterial: z.array(
    z.object({
      kasbon_material_type_id: z.number().int(),
      price: z.number(),
      qty: z.number().int(),
    })
  ).optional(),
});

export class CreatePlanDto extends createZodDto(createPlanSchema) {}

export const updatePlanSchema = createPlanSchema.partial();
export class UpdatePlanDto extends createZodDto(updatePlanSchema) {}

export const updateStatusPlanSchema = z.object({
  status: z.string(),
});
export class UpdateStatusPlanDto extends createZodDto(updateStatusPlanSchema) {}

export const findAllPlanSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  market_area_id: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  tanggalPergiKanvasStart: z.string().optional(),
  tanggalPergiKanvasEnd: z.string().optional(),
});
export class FindAllPlanDto extends createZodDto(findAllPlanSchema) {}