import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z
  .object({
    username: z.string().min(1, 'Username wajib diisi'),
    password: z.string().min(1, 'Password wajib diisi'),
  })
  .strict();

export class LoginDto extends createZodDto(loginSchema) {}
