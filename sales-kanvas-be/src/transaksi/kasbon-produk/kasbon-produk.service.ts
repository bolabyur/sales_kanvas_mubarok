import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKasbonProdukDto } from './dto/kasbon-produk.dto';

@Injectable()
export class KasbonProdukService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateKasbonProdukDto, userId: number, ip: string) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.salesKanvasPlan.findUnique({ where: { id: data.sales_kanvas_plan_id } });
      if (!plan) throw new NotFoundException('Rencana Kanvas tidak ditemukan');
      if (plan.status !== 'DISETUJUI') {
        throw new BadRequestException('BON hanya bisa dibuat jika Rencana Kanvas sudah disetujui Supervisor.');
      }

     
      const bon = await tx.kasbonProduk.create({
        data: {
          sales_kanvas_plan_id: data.sales_kanvas_plan_id,
          status: 'PENDING', 
        },
      });

      for (const item of data.details) {
        const batch = await tx.batch.findUnique({ where: { id: item.batch_id } });
        if (!batch) throw new BadRequestException(`Batch ID ${item.batch_id} tidak ditemukan`);
        if (batch.stok_gudang < item.qty_bawa) {
          throw new BadRequestException(`Stok tidak cukup untuk Batch ${batch.no_batch}`);
        }

        await tx.detailKasbonProduk.create({
          data: {
            kasbon_produk_id: bon.id,
            produk_id: item.produk_id,
            batch_id: item.batch_id,
            qty_bawa: item.qty_bawa,
          },
        });
      }
      return bon;
    });
  }

  async updateStatus(id: number, status: string, userId: number, ip: string) {
    const bon = await this.prisma.kasbonProduk.findUnique({ where: { id } });
    if (!bon) throw new NotFoundException('BON tidak ditemukan');

    // PENGUNCIAN: Jika sudah disetujui, tidak bisa diubah
    if (bon.status === 'APPROVED') {
      throw new BadRequestException('BON yang sudah di-ACC tidak dapat diubah statusnya.');
    }

    return this.prisma.kasbonProduk.update({
      where: { id },
      data: { 
        status,
      },
    });
  }

  async findAll() {
    return this.prisma.kasbonProduk.findMany({
      where: { is_deleted: false },
      include: { 
        salesKanvasPlan: true, 
        detailKasbonProduks: { include: { produk: true, batch: true } } 
      },
      orderBy: { id: 'desc' } 
    });
  }
}