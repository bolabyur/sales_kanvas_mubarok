import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.vehicele.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.vehicele.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateVehicleDto, userId: number, ip: string) {
    return this.prisma.vehicele.create({
      data: { ...dto, user_id: userId, ip },
    });
  }

  update(id: number, dto: UpdateVehicleDto, userId: number, ip: string) {
    return this.prisma.vehicele.update({
      where: { id },
      data: { ...dto, user_id: userId, ip, updated_at: new Date() },
    });
  }

  remove(id: number) {
    return this.prisma.vehicele.delete({ where: { id } });
  }
}
