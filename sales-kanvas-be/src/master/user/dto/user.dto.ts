import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  karyawan_id: z.number().int(),
  role_id: z.number().int(),
  is_active: z.boolean().default(true),
});
export class CreateUserDto extends createZodDto(createUserSchema) {}

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(), 
});
export class UpdateUserDto extends createZodDto(updateUserSchema) {}