import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const id = z.number().int().positive();

const employeeSchema = z
  .object({
    avatar_file_id: id.optional().nullable(),
    name: z.string().min(1),
    nip: z.string().optional().nullable(),
    pin_fingerprint: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    tipe_upah_id: id.optional().nullable(),
    employee_position_id: id,
    employee_job_id: id,
    employee_contract_id: id,
    devisi_id: id,
    gender: z.enum(['MALE', 'FEMALE']),
    agama: z.string().min(1),
    tgl_lahir: z.coerce.date(),
    tgl_masuk: z.coerce.date(),
    hari_libur_mingguan: z.number().int().min(0).max(6).optional().nullable(),
    jam_kerja_id: id.optional().nullable(),
    is_active: z.boolean().default(true),
  })
  .strict();

export class CreateEmployeeDto extends createZodDto(employeeSchema) {}
export class UpdateEmployeeDto extends createZodDto(employeeSchema.partial()) {}
