import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdukInDto } from './dto/produk-in.dto';

@Injectable()
export class ProdukInService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProdukInDto) {
    return this.prisma.$transaction(async (tx) => {
      const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_id } });
      if (!gudang) throw new NotFoundException('Gudang ID tidak ditemukan');

      const produkIn = await tx.produkIn.create({
        data: {
          sales_kanvas_plan_id: data.sales_kanvas_plan_id,
          gudang_id: data.gudang_id,
          tgl_masuk: new Date(data.tgl_masuk),
        },
      });

      for (const item of data.details) {
        const batch = await tx.batch.findUnique({ where: { id: item.batch_id } });
        if (!batch) throw new NotFoundException(`Batch ID ${item.batch_id} tidak ditemukan`);

        await tx.detailProdukIn.create({
          data: {
            produk_in_id: produkIn.id,
            produk_id: item.produk_id,
            batch_id: item.batch_id,
            qty_sisa: item.qty_sisa,
            kondisi: item.kondisi,
          },
        });

        if (item.kondisi === 'Bagus') {
          await tx.batch.update({
            where: { id: item.batch_id },
            data: { stok_gudang: { increment: item.qty_sisa } },
          });
        }

        await tx.mutasiBatch.create({
          data: {
            batch_id: item.batch_id,
            tipe_mutasi: 'IN',
            qty: item.qty_sisa,
            keterangan: `Unloading Sisa (Kondisi: ${item.kondisi}) - Plan #${data.sales_kanvas_plan_id}`,
          },
        });
      }

      return produkIn;
    });
  }

  async findAll() {
    return this.prisma.produkIn.findMany({
      where: { is_deleted: false },
      include: {
        salesKanvasPlan: true,
        detailProdukIns: { include: { produk: true, batch: true } },
      },
    });
  }
}