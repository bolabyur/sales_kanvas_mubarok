import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SummaryService {
  constructor(private prisma: PrismaService) {}

  async getSummarySale(startDate?: string, endDate?: string) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const dateFilter = { gte: start, lte: end };

    const invoices = await this.prisma.invoiceOutlet.aggregate({
      where: { tgl_invoice: dateFilter, is_deleted: false },
      _sum: { total_tagihan: true },
      _count: { id: true },
    });

    const salesByType = await this.prisma.invoiceOutlet.groupBy({
      by: ['tipe_pembayaran'],
      where: { tgl_invoice: dateFilter, is_deleted: false },
      _sum: { total_tagihan: true },
    });

    const returns = await this.prisma.invoiceReturProduk.aggregate({
      where: { updated_at: dateFilter, is_deleted: false },
      _sum: { total_nilai_retur: true },
      _count: { id: true },
    });

    // PERBAIKAN: Hitung Total Kasbon Operasional
    const kasbons = await this.prisma.kasbonOperasional.aggregate({
      where: { updated_at: dateFilter, is_deleted: false },
      _sum: { nominal_kasbon: true },
    });

    // PERBAIKAN: Hitung Total Piutang Baru (Berdasarkan Invoice yang terbit di periode ini)
    const piutangs = await this.prisma.kartuPiutangOutlet.aggregate({
      where: {
        invoiceOutlet: { tgl_invoice: dateFilter, is_deleted: false },
        is_deleted: false,
      },
      _sum: { sisa_piutang: true },
    });

    const totalBruto = invoices._sum.total_tagihan?.toNumber() || 0;
    const totalRetur = returns._sum.total_nilai_retur?.toNumber() || 0;
    const totalKasbon = kasbons._sum.nominal_kasbon?.toNumber() || 0;
    const totalPiutang = piutangs._sum.sisa_piutang?.toNumber() || 0;

    return {
      periode: { start, end },
      total_invoice: invoices._count.id,
      penjualan_bruto: totalBruto,
      total_retur: totalRetur,
      penjualan_neto: totalBruto - totalRetur,
      total_kasbon: totalKasbon,
      total_piutang: totalPiutang,
      rincian_pembayaran: salesByType.map((item) => ({
        tipe: item.tipe_pembayaran,
        total: item._sum.total_tagihan?.toNumber() || 0,
      })),
    };
  }


  async getSummarySaleZona(startDate?: string, endDate?: string) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        ma.id as market_area_id,
        ma.name as nama_zona,
        COUNT(DISTINCT io.id) as total_invoice,
        COALESCE(SUM(io.total_tagihan), 0) as total_penjualan
      FROM invoice_outlet io
      JOIN ts_sales_kanvas_plan skp ON io.sales_kanvas_plan_id = skp.id
      JOIN ms_market_area ma ON skp.market_area_id = ma.id
      WHERE io.tgl_invoice >= ${start} 
        AND io.tgl_invoice <= ${end}
        AND io.is_deleted = false
      GROUP BY ma.id, ma.name
      ORDER BY total_penjualan DESC
    `;

    return result.map((row) => ({
      ...row,
      total_penjualan: Number(row.total_penjualan),
      total_invoice: Number(row.total_invoice),
    }));
  }

  async getSummaryRekonsiliasi(status?: string) {
    const piutangs = await this.prisma.kartuPiutangOutlet.findMany({
      where: { sisa_piutang: { gt: 0 }, is_deleted: false },
      include: {
        invoiceOutlet: {
          include: {
            outlet: true,
            salesKanvasPlan: { include: { marketArea: true } },
          },
        },
      },
    });

    const today = new Date();
    let totalPiutang = 0;
    let totalMenunggak = 0;
    let jumlahOutletMenunggak = new Set<number>();

    const details = piutangs.map((p) => {
      const sisa = p.sisa_piutang.toNumber();
      totalPiutang += sisa;

      const isOverdue = p.jatuh_tempo && new Date(p.jatuh_tempo) < today;
      if (isOverdue) {
        totalMenunggak += sisa;
        if (p.invoiceOutlet?.outlet_id) {
          jumlahOutletMenunggak.add(p.invoiceOutlet.outlet_id);
        }
      }

      return {
        invoice_id: p.invoice_outlet_id,
        outlet: p.invoiceOutlet?.outlet?.nama_toko || 'Unknown',
        zona: p.invoiceOutlet?.salesKanvasPlan?.marketArea?.name || 'Unknown',
        tgl_invoice: p.invoiceOutlet?.tgl_invoice,
        jatuh_tempo: p.jatuh_tempo,
        sisa_piutang: sisa,
        status: isOverdue ? 'MENUNGGAK' : 'BELUM_JATUH_TEMPO',
      };
    });

    const filteredDetails = status 
      ? details.filter(d => d.status === status.toUpperCase())
      : details;

    return {
      ringkasan: {
        total_saldo_piutang: totalPiutang,
        total_piutang_menunggak: totalMenunggak,
        jumlah_outlet_menunggak: jumlahOutletMenunggak.size,
      },
      daftar_piutang: filteredDetails,
    };
  }
}