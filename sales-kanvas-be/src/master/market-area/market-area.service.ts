import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMarketAreaDto, UpdateMarketAreaDto } from './market-area.dto';

@Injectable()
export class MarketAreaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.marketArea.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.marketArea.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateMarketAreaDto, userId: number, ip: string) {
    return this.prisma.marketArea.create({
      data: { ...dto, user_id: userId, ip },
    });
  }

  update(id: number, dto: UpdateMarketAreaDto, userId: number, ip: string) {
    return this.prisma.marketArea.update({
      where: { id },
      data: { ...dto, user_id: userId, ip, updated_at: new Date() },
    });
  }

  remove(id: number) {
    return this.prisma.marketArea.delete({ where: { id } });
  }
}
