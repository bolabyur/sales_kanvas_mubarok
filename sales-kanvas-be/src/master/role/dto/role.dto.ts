import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1),
  permissionIds: z.array(z.number().int()).default([]),
});
export class CreateRoleDto extends createZodDto(createRoleSchema) {}

export const updateRoleSchema = createRoleSchema.partial();
export class UpdateRoleDto extends createZodDto(updateRoleSchema) {}