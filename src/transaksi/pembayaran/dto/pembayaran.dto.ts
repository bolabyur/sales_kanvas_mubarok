import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPembayaranSchema = z.object({
  invoice_outlet_id: z.number().int(),
  nominal_bayar: z.number().min(1, 'Nominal bayar harus lebih dari 0'),
  tipe_bayar: z.enum(['Tunai', 'Transfer']),
  tgl_bayar: z.string().datetime(),
});

export class CreatePembayaranDto extends createZodDto(createPembayaranSchema) {}