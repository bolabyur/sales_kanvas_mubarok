import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOutletDto, UpdateOutletDto } from './dto/outlet.dto';

@Injectable()
export class OutletService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateOutletDto) {
    const tipeHarga = await this.prisma.tipeHarga.findUnique({
      where: { id: data.tipe_harga_id },
    });

    if (!tipeHarga) {
      throw new BadRequestException(
        `Gagal membuat Outlet: Tipe Harga dengan ID ${data.tipe_harga_id} tidak ditemukan di database.`
      );
    }

    return this.prisma.outlet.create({ data });
  }

  async findAll() {
    return this.prisma.outlet.findMany({
      where: { is_deleted: false },
      include: { tipeHarga: true },
    });
  }

  async findOne(id: number) {
    const outlet = await this.prisma.outlet.findFirst({
      where: { id, is_deleted: false },
      include: { tipeHarga: true },
    });
    if (!outlet) throw new NotFoundException('Outlet tidak ditemukan');
    return outlet;
  }

  async update(id: number, data: UpdateOutletDto) {
    await this.findOne(id);
    if (data.tipe_harga_id) {
      const tipeHarga = await this.prisma.tipeHarga.findUnique({ where: { id: data.tipe_harga_id } });
      if (!tipeHarga) {
        throw new BadRequestException(`Tipe Harga dengan ID ${data.tipe_harga_id} tidak ditemukan.`);
      }
    }
    return this.prisma.outlet.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.outlet.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
}