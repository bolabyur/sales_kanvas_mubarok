import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKanvasReturnDto } from './dto/kanvas-return.dto';

@Injectable()
export class KanvasReturnService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateKanvasReturnDto, userId: number, ip: string) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.salesKanvasPlan.findUnique({ where: { id: data.sales_kanvas_plan_id } });
      if (!plan) throw new NotFoundException('Plan tidak ditemukan');

      const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_tujuan_id } });
      if (!gudang) throw new NotFoundException('Gudang tujuan tidak ditemukan');

      const kanvasReturn = await tx.kanvasReturn.create({
        data: {
          sales_kanvas_plan_id: data.sales_kanvas_plan_id,
          gudang_tujuan_id: data.gudang_tujuan_id,
          tgl_retur: new Date(data.tgl_retur),
          status: 'VERIFIED', 
          user_id: userId,
          ip: ip,
        },
      });

      for (const item of data.details) {
        const batch = await tx.batch.findUnique({ where: { id: item.batch_id } });
        if (!batch) throw new BadRequestException(`Batch ID ${item.batch_id} tidak ditemukan`);

        await tx.kanvasReturnDetail.create({
          data: {
            kanvas_return_id: kanvasReturn.id,
            batch_id: item.batch_id,
            produk_id: item.produk_id,
            qty: item.qty,
            kondisi: item.kondisi,
            alasan: item.alasan,
          },
        });

        if (item.kondisi === 'BAGUS') {
          await tx.batch.update({
            where: { id: item.batch_id },
            data: { stok_gudang: { increment: item.qty } },
          });
        }

        await tx.mutasiBatch.create({
          data: {
            batch_id: item.batch_id,
            tipe_mutasi: 'IN',
            qty: item.qty,
            keterangan: `RETUR KANVAS (${item.kondisi}) - Plan #${data.sales_kanvas_plan_id}`,
          },
        });
      }

      return kanvasReturn;
    });
  }

  async findAll() {
    return this.prisma.kanvasReturn.findMany({
      where: { is_deleted: false },
      include: {
        salesKanvasPlan: true,
        gudangTujuan: true,
        details: { include: { produk: true, batch: true } },
      },
      orderBy: { id: 'desc' },
    });
  }
}