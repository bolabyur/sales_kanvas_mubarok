import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePembayaranDto } from './dto/pembayaran.dto';

@Injectable()
export class PembayaranService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePembayaranDto) {
    return this.prisma.$transaction(async (tx) => {
      const piutang = await tx.kartuPiutangOutlet.findUnique({
        where: { invoice_outlet_id: data.invoice_outlet_id },
      });

      if (!piutang) throw new NotFoundException('Kartu Piutang tidak ditemukan untuk invoice ini');
      if (data.nominal_bayar > Number(piutang.sisa_piutang)) {
        throw new BadRequestException(`Nominal bayar (${data.nominal_bayar}) melebihi sisa piutang (${piutang.sisa_piutang})`);
      }

      const pembayaran = await tx.pembayaranInvoice.create({
        data: {
          invoice_outlet_id: data.invoice_outlet_id,
          nominal_bayar: data.nominal_bayar,
          tipe_bayar: data.tipe_bayar,
          tgl_bayar: new Date(data.tgl_bayar),
        },
      });

      await tx.kartuPiutangOutlet.update({
        where: { id: piutang.id },
        data: { sisa_piutang: { decrement: data.nominal_bayar } },
      });

      return pembayaran;
    });
  }

  async findAll() {
    return this.prisma.pembayaranInvoice.findMany({
      where: { is_deleted: false },
      include: { invoiceOutlet: true },
    });
  }
}