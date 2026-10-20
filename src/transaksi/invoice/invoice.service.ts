import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {

      const outlet = await tx.outlet.findUnique({ where: { id: data.outlet_id } });
      if (!outlet) throw new NotFoundException('Outlet ID tidak ditemukan');
      
      const plan = await tx.salesKanvasPlan.findUnique({ where: { id: data.sales_kanvas_plan_id } });
      if (!plan) throw new NotFoundException('Rencana Kanvas (Plan ID) tidak ditemukan');

      let total_tagihan = 0;
      for (const item of data.details) {
        const batch = await tx.batch.findUnique({ where: { id: item.batch_id } });
        if (!batch) throw new NotFoundException(`Batch ID ${item.batch_id} tidak ditemukan`);
        if (batch.stok_gudang < item.qty) {
          throw new BadRequestException(`Stok tidak cukup untuk Batch ${batch.no_batch}. Sisa: ${batch.stok_gudang}`);
        }
        total_tagihan += item.qty * item.harga_satuan;
      }

      const invoice = await tx.invoiceOutlet.create({
        data: {
          outlet_id: data.outlet_id,
          sales_kanvas_plan_id: data.sales_kanvas_plan_id,
          tipe_pembayaran: data.tipe_pembayaran,
          total_tagihan: total_tagihan,
          tgl_invoice: new Date(data.tgl_invoice),
        },
      });

      for (const item of data.details) {
        await tx.detailInvoiceOutlet.create({
          data: {
            invoice_outlet_id: invoice.id,
            produk_id: item.produk_id,
            batch_id: item.batch_id,
            qty: item.qty,
            harga_satuan: item.harga_satuan,
            subtotal: item.qty * item.harga_satuan,
          },
        });
        await tx.batch.update({
          where: { id: item.batch_id },
          data: { stok_gudang: { decrement: item.qty } },
        });
        await tx.mutasiBatch.create({
          data: {
            batch_id: item.batch_id,
            tipe_mutasi: 'OUT',
            qty: item.qty,
            keterangan: `Penjualan Invoice #${invoice.id}`,
          },
        });
      }

      if (data.tipe_pembayaran === 'Kredit') {
        await tx.kartuPiutangOutlet.create({
          data: { invoice_outlet_id: invoice.id, sisa_piutang: total_tagihan },
        });
      }

      return invoice;
    });
  }

  async findAll() {
    return this.prisma.invoiceOutlet.findMany({
      where: { is_deleted: false },
      include: { outlet: true, detailInvoiceOutlets: { include: { produk: true, batch: true } }, kartuPiutangOutlet: true },
    });
  }
}