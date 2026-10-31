import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPembayaranSchema = z.object({
  invoice_outlet_id: z.number().int(),
  nominal_bayar: z.number().int().positive('Nominal harus berupa angka bulat (tanpa desimal)'),
  tipe_bayar: z.enum(['Tunai', 'Transfer']),
  tgl_bayar: z.string().datetime(),
});

export class CreatePembayaranDto extends createZodDto(createPembayaranSchema) {}