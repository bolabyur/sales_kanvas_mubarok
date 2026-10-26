import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const summaryQuerySchema = z.object({
  startDate: z.string().optional().describe('Format: YYYY-MM-DD'),
  endDate: z.string().optional().describe('Format: YYYY-MM-DD'),
  status: z.enum(['MENUNGGAK', 'BELUM_JATUH_TEMPO']).optional(),
});

export class SummaryQueryDto extends createZodDto(summaryQuerySchema) {}