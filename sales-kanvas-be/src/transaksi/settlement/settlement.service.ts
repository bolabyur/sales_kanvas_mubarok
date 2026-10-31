import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSettlementDto } from './dto/settlement.dto';
import { EventEmitter2 } from '@nestjs/event-emitter'; // ✅
import { SettlementSubmittedEvent } from './events/settlement-submitted.event'; // ✅

@Injectable()
export class SettlementService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2, // ✅
  ) {}

  // ✅ Tambahkan parameter userId (pastikan Controller mengirimkannya)
  async create(data: CreateSettlementDto, userId: number) {
    const result = await this.prisma.$transaction(async (tx) => {
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
      if (plan.status === 'Settled' || plan.status === 'BATAL') {
        throw new BadRequestException('Status Plan tidak valid untuk di-settle');
      }

      let totalPenjualanTunai = 0;
      let totalPiutangBaru = 0;

      for (const inv of plan.invoiceOutlets) {
        if ((inv as any).is_deleted) continue;

        if (inv.tipe_pembayaran === 'Tunai') {
          totalPenjualanTunai += Number(inv.total_tagihan);
        } else {
          totalPiutangBaru += Number(inv.total_tagihan);
        }
      }

      let totalKasbonRealisasi = 0;
      for (const kasbon of plan.kasbonOperasionals) {
        if ((kasbon as any).is_deleted) continue;
        totalKasbonRealisasi += Number(kasbon.nominal_kasbon);
      }

      const uangSeharusnyaDisetor = totalPenjualanTunai + totalKasbonRealisasi;
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

      return { settlement, planInvoice: plan.invoice, totalPenjualanTunai };
    });

    // 🚀 TEMBAK EVENT SETELAH TRANSAKSI BERHASIL
    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    this.eventEmitter.emit(
      "settlement.submitted",
      new SettlementSubmittedEvent(
        result.settlement.id,
        result.planInvoice,
        result.totalPenjualanTunai,
        userId,
        actor?.name || "Sales",
      ),
    );

    return result.settlement;
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const whereClause: any = { is_deleted: false };
    
    if (search) {
      whereClause.OR = [
        { salesKanvasPlan: { invoice: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where: whereClause,
        include: {
          salesKanvasPlan: {
            select: { invoice: true, tgl_pergi_kanvas: true }
          },
          approver: {
            select: { name: true }
          }
        },
        skip,
        take: limit,
        orderBy: { updated_at: 'desc' },
      }),
      this.prisma.settlement.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}