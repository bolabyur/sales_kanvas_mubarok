import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTipeHargaDto, UpdateTipeHargaDto } from './dto/tipe-harga.dto';

@Injectable()
export class TipeHargaService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTipeHargaDto) {
    return this.prisma.tipeHarga.create({ data });
  }

  async findAll() {
    return this.prisma.tipeHarga.findMany({
      where: { is_deleted: false },
    });
  }

  async findOne(id: number) {
    const data = await this.prisma.tipeHarga.findFirst({
      where: { id, is_deleted: false },
    });
    if (!data) throw new NotFoundException('Tipe Harga tidak ditemukan');
    return data;
  }

  async update(id: number, data: UpdateTipeHargaDto) {
    await this.findOne(id);
    return this.prisma.tipeHarga.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tipeHarga.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
}