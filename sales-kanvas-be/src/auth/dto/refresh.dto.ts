import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const refreshSchema = z
  .object({
    refresh_token: z.string().min(1, 'Refresh token wajib diisi'),
  })
  .strict();

export class RefreshDto extends createZodDto(refreshSchema) {}
