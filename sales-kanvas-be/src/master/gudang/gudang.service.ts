import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGudangDto, UpdateGudangDto } from './dto/gudang.dto';

@Injectable()
export class GudangService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateGudangDto) {
    return this.prisma.gudang.create({ data });
  }

  async findAll() {
    return this.prisma.gudang.findMany({
      where: { is_deleted: false },
    });
  }

  async findOne(id: number) {
    const gudang = await this.prisma.gudang.findFirst({
      where: { id, is_deleted: false },
    });
    if (!gudang) throw new NotFoundException('Gudang tidak ditemukan');
    return gudang;
  }

  async update(id: number, data: UpdateGudangDto) {
    await this.findOne(id);
    return this.prisma.gudang.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.gudang.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
}