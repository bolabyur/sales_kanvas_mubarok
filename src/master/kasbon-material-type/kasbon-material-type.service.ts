import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateKasbonMaterialTypeDto,
  UpdateKasbonMaterialTypeDto,
} from './kasbon-material-type.dto';

@Injectable()
export class KasbonMaterialTypeService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.kanvasKasbonMaterialType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.kanvasKasbonMaterialType.findUniqueOrThrow({
      where: { id },
    });
  }

  create(dto: CreateKasbonMaterialTypeDto, userId: number, ip: string) {
    return this.prisma.kanvasKasbonMaterialType.create({
      data: { ...dto, user_id: userId, ip },
    });
  }

  update(
    id: number,
    dto: UpdateKasbonMaterialTypeDto,
    userId: number,
    ip: string,
  ) {
    return this.prisma.kanvasKasbonMaterialType.update({
      where: { id },
      data: { ...dto, user_id: userId, ip, updated_at: new Date() },
    });
  }

  remove(id: number) {
    return this.prisma.kanvasKasbonMaterialType.delete({ where: { id } });
  }
}
