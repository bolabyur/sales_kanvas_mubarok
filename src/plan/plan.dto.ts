import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const PLAN_STATUS = {
  DRAFT: 'DRAFT',
  DISETUJUI: 'DISETUJUI',
  BATAL: 'BATAL',
  REVISI: 'REVISI',
  LOADING: 'LOADING',
  KOMPLIT: 'KOMPLIT',
} as const;

// status TIDAK diinput dari client — selalu diatur BE (DRAFT saat create,
// ikut status lama saat revisi).
const createPlanSchema = z
  .object({
    tgl_invoice: z.string(),
    tgl_pergi_kanvas: z.string(),
    tgl_kembali_kanvas: z.string().optional().nullable(),
    market_area_id: z.number(),
    vehicle_id: z.number().int().positive(),
    note: z.string().optional().nullable(),
    salesKanvasPlanPersonil: z.array(
      z
        .object({
          employee_id: z.number().int().positive(),
          position: z.string(),
        })
        .strict(),
    ),
    salesKanvasPlanDetail: z.array(
      z
        .object({
          product_id: z.number().positive(),
          qty: z.number().positive(),
        })
        .strict(),
    ),
    salesKanvasKasbonMaterial: z
      .array(
        z
          .object({
            kasbon_material_type_id: z.number().int().positive(),
            price: z.number().positive(),
            qty: z.number().int().positive(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export class CreatePlanDto extends createZodDto(createPlanSchema) {}

export class UpdatePlanDto extends createZodDto(createPlanSchema.partial()) {}

export class UpdateStatusPlanDto extends createZodDto(
  z
    .object({
      status: z.enum(Object.values(PLAN_STATUS) as [string, ...string[]]),
    })
    .strict(),
) {}

export class FindAllPlanDto extends createZodDto(
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    sortBy: z
      .enum(['id', 'invoice', 'tgl_invoice', 'tgl_pergi_kanvas', 'created_at'])
      .default('id'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    status: z.string().optional(),
    tanggalPergiKanvasStart: z.string().optional(),
    tanggalPergiKanvasEnd: z.string().optional(),
    market_area_id: z.coerce.number().int().positive().optional(),
  }),
) {}
