import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdukHargaDto, UpdateProdukHargaDto } from './dto/produk-harga.dto';

@Injectable()
export class ProdukHargaService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProdukHargaDto) {
    return this.prisma.produkHarga.create({ data });
  }

  async findAll() {
    return this.prisma.produkHarga.findMany({
      where: { is_deleted: false },
      include: { produk: true, tipeHarga: true },
    });
  }

  async findOne(id: number) {
    const harga = await this.prisma.produkHarga.findFirst({
      where: { id, is_deleted: false },
      include: { produk: true, tipeHarga: true },
    });
    if (!harga) throw new NotFoundException('Produk Harga tidak ditemukan');
    return harga;
  }

  async update(id: number, data: UpdateProdukHargaDto) {
    await this.findOne(id);
    return this.prisma.produkHarga.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    // Soft Delete
    return this.prisma.produkHarga.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
}