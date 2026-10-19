import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // List hanya produk aktif (untuk dropdown); detail by id tetap bisa semua.
  findAll() {
    return this.prisma.product.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.product.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateProductDto, userId: number, ip: string) {
    return this.prisma.product.create({
      data: { ...dto, user_id: userId, ip },
    });
  }

  update(id: number, dto: UpdateProductDto, userId: number, ip: string) {
    return this.prisma.product.update({
      where: { id },
      data: { ...dto, user_id: userId, ip, updated_at: new Date() },
    });
  }

  // Ditolak (400 Invalid reference) bila sudah dipakai plan — nonaktifkan
  // lewat PATCH { is_active: false } sebagai gantinya.
  remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }
}
