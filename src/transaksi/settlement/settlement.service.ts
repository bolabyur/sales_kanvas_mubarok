import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSettlementDto } from './dto/settlement.dto';

@Injectable()
export class SettlementService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSettlementDto) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.salesKanvasPlan.findUnique({
        where: { id: data.sales_kanvas_plan_id },
        include: {
          invoiceOutlets: true,
          kasbonOperasionals: true,
          settlements: true,
        },
      });

      if (!plan) throw new NotFoundException('Rencana Kanvas tidak ditemukan');
      if (plan.settlements.length > 0) throw new BadRequestException('Plan ini sudah di-settle');
      if (plan.status === 'Settled') throw new BadRequestException('Status Plan sudah Settled');

      let totalPenjualanTunai = 0;
      let totalPiutangBaru = 0;

      for (const inv of plan.invoiceOutlets) {
        if (inv.tipe_pembayaran === 'Tunai') {
          totalPenjualanTunai += Number(inv.total_tagihan);
        } else {
          totalPiutangBaru += Number(inv.total_tagihan);
        }
      }

      let totalKasbonRealisasi = 0;
      for (const kasbon of plan.kasbonOperasionals) {
        totalKasbonRealisasi += Number(kasbon.nominal_kasbon);
      }

      const uangSeharusnyaDisetor = totalPenjualanTunai - totalKasbonRealisasi;
      const selisihKas = data.uang_fisik_diterima - uangSeharusnyaDisetor;

      const settlement = await tx.settlement.create({
        data: {
          sales_kanvas_plan_id: data.sales_kanvas_plan_id,
          total_penjualan_tunai: totalPenjualanTunai,
          total_piutang_baru: totalPiutangBaru,
          total_kasbon_realisasi: totalKasbonRealisasi,
          selisih_kas: selisihKas,
          status: 'Closed',
          approved_by: data.approved_by,
        },
      });

      await tx.salesKanvasPlan.update({
        where: { id: plan.id },
        data: { status: 'Settled' },
      });

      return settlement;
    });
  }

  async findAll() {
    return this.prisma.settlement.findMany({
      where: { is_deleted: false },
      include: {
        salesKanvasPlan: true,
        approver: true,
      },
    });
  }
}