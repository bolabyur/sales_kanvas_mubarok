import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePembayaranDto } from './dto/pembayaran.dto';

@Injectable()
export class PembayaranService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePembayaranDto) {
    return this.prisma.$transaction(async (tx) => {
      // Cari Kartu Piutang
      const kartuPiutang = await tx.kartuPiutangOutlet.findUnique({
        where: { invoice_outlet_id: data.invoice_outlet_id },
      });

      if (!kartuPiutang) {
        throw new NotFoundException('Kartu Piutang tidak ditemukan untuk invoice ini');
      }

      const pembayaran = await tx.pembayaranInvoice.create({
        data: {
          invoice_outlet_id: data.invoice_outlet_id,
          nominal_bayar: data.nominal_bayar,
          tipe_bayar: data.tipe_bayar,
          tgl_bayar: new Date(data.tgl_bayar),
        },
      });

      const sisaPiutangBaru = kartuPiutang.sisa_piutang.toNumber() - data.nominal_bayar;
      
      await tx.kartuPiutangOutlet.update({
        where: { id: kartuPiutang.id },
        data: { sisa_piutang: sisaPiutangBaru },
      });

      return pembayaran;
    });
  }

  async findAll() {
    return this.prisma.pembayaranInvoice.findMany({
      where: { is_deleted: false },
      include: { invoiceOutlet: true },
      orderBy: { updated_at: 'desc' },
    });
  }
}