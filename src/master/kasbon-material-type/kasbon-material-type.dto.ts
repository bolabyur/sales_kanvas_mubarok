import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const kasbonMaterialTypeSchema = z.object({ name: z.string().min(1) }).strict();

export class CreateKasbonMaterialTypeDto extends createZodDto(
  kasbonMaterialTypeSchema,
) {}
export class UpdateKasbonMaterialTypeDto extends createZodDto(
  kasbonMaterialTypeSchema.partial(),
) {}
