import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createKasbonMaterialTypeSchema = z.object({
  name: z.string().min(1),
});
export class CreateKasbonMaterialTypeDto extends createZodDto(createKasbonMaterialTypeSchema) {}
export class UpdateKasbonMaterialTypeDto extends createZodDto(createKasbonMaterialTypeSchema.partial()) {}