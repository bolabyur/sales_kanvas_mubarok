import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const vehicleSchema = z
  .object({
    name: z.string().min(1),
    type_vehicle: z.string().min(1), // truk, bus
    nopol: z.string().min(1),
    type_fuel: z.string().min(1), // bensin, solar
  })
  .strict();

export class CreateVehicleDto extends createZodDto(vehicleSchema) {}
export class UpdateVehicleDto extends createZodDto(vehicleSchema.partial()) {}
