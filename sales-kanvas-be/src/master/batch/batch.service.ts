import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/batch.dto';

@Injectable()
export class BatchService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateBatchDto) {
    const expiredDate = new Date(data.expired_date);
    if (expiredDate < new Date()) {
      throw new BadRequestException('Tanggal expired tidak boleh di masa lalu');
    }

    return this.prisma.batch.create({
      data: {
        ...data,
        expired_date: expiredDate,
      },
    });
  }

  async findAll() {
    return this.prisma.batch.findMany({
      where: { is_deleted: false },
      include: { produk: true },
      orderBy: { expired_date: 'asc' }, 
    });
  }

  async findOne(id: number) {
    const data = await this.prisma.batch.findFirst({
      where: { id, is_deleted: false },
      include: { produk: true },
    });
    if (!data) throw new NotFoundException('Batch tidak ditemukan');
    return data;
  }

  async update(id: number, data: UpdateBatchDto) {
    await this.findOne(id);
    

    const updateData: any = { ...data };
    if (data.expired_date) {
      updateData.expired_date = new Date(data.expired_date);
    }

    return this.prisma.batch.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.batch.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
}