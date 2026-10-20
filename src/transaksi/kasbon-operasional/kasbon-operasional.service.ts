import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKasbonOperasionalDto } from './dto/kasbon-operasional.dto';

@Injectable()
export class KasbonOperasionalService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateKasbonOperasionalDto) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.salesKanvasPlan.findUnique({ where: { id: data.sales_kanvas_plan_id } });
      if (!plan) throw new NotFoundException('Rencana Kanvas (Plan ID) tidak ditemukan');

      const kasbon = await tx.kasbonOperasional.create({
        data: {
          sales_kanvas_plan_id: data.sales_kanvas_plan_id,
          nominal_kasbon: data.nominal_kasbon,
          status: 'Pending',
        },
      });

      for (const item of data.details) {
        await tx.detailKasbonOperasional.create({
          data: {
            kasbon_operasional_id: kasbon.id,
            nama_pengeluaran: item.nama_pengeluaran,
            nominal: item.nominal,
            foto_bukti: item.foto_bukti,
          },
        });
      }

      return kasbon;
    });
  }

  async findAll() {
    return this.prisma.kasbonOperasional.findMany({
      where: { is_deleted: false },
      include: {
        salesKanvasPlan: true,
        detailKasbonOperasional: true,
      },
    });
  }
}