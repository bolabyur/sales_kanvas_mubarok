import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBatchDto, UpdateBatchDto, AdjustStockDto } from './dto/batch.dto';

@Injectable()
export class BatchService {
  constructor(private prisma: PrismaService) {}

  private parseAndValidateExpiredDate(input?: string | Date): Date {
    if (!input) throw new BadRequestException('Tanggal expired (ED) wajib diisi.');
    const ed = input instanceof Date ? input : new Date(input);
    if (isNaN(ed.getTime())) throw new BadRequestException('Format tanggal expired tidak valid.');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(ed);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      throw new BadRequestException('Tanggal expired tidak boleh di masa lalu.');
    }

    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 5);
    
    if (inputDate > maxDate) {
      throw new BadRequestException('Tanggal expired maksimal 5 bulan dari hari ini.');
    }

    return ed;
  }

  async create(data: CreateBatchDto) {
    const expiredDate = this.parseAndValidateExpiredDate(data.expired_date);
    return this.prisma.batch.create({
      data: { ...data, expired_date: expiredDate },
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
      include: {
        produk: true,
        mutasiBatches: {
          orderBy: { created_at: 'desc' },
          take: 50, 
        }
      },
    });
    if (!data) throw new NotFoundException('Batch tidak ditemukan');

    const totalMutasi = await this.prisma.mutasiBatch.count({
      where: { batch_id: id },
    });

    return { ...data, totalMutasi };
  }

  async update(id: number, data: UpdateBatchDto) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.expired_date) {
      updateData.expired_date = this.parseAndValidateExpiredDate(data.expired_date);
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

  async adjustStock(id: number, data: AdjustStockDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({ where: { id, is_deleted: false } });
      if (!batch) throw new NotFoundException('Batch tidak ditemukan');

      const stokBaru = batch.stok_gudang + data.qty_delta;
      
      if (stokBaru < 0) {
        throw new BadRequestException(`Koreksi gagal. Stok saat ini ${batch.stok_gudang}, tidak cukup untuk dikurangi ${Math.abs(data.qty_delta)}.`);
      }

      const updatedBatch = await tx.batch.update({
        where: { id },
        data: { stok_gudang: stokBaru },
      });

      await tx.mutasiBatch.create({
        data: {
          batch_id: id,
          tipe_mutasi: data.qty_delta > 0 ? 'ADJUST_IN' : 'ADJUST_OUT',
          qty: Math.abs(data.qty_delta),
          keterangan: `Koreksi Manual: ${data.alasan} (User ID: ${userId})`,
        },
      });

      return updatedBatch;
    }, { isolationLevel: 'Serializable' });
  }
}