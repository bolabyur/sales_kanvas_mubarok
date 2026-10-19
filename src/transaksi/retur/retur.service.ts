import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReturDto } from './dto/retur.dto';

@Injectable()
export class ReturService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateReturDto) {
    return this.prisma.$transaction(async (tx) => {
      const retur = await tx.invoiceReturProduk.create({
        data: {
          outlet_id: data.outlet_id,
          invoice_outlet_id: data.invoice_outlet_id || null,
          gudang_retur_id: data.gudang_retur_id,
          total_nilai_retur: data.total_nilai_retur,
        },
      });

      for (const item of data.details) {
        await tx.detailInvoiceReturProduk.create({
          data: {
            invoice_retur_produk_id: retur.id,
            produk_id: item.produk_id,
            batch_id: item.batch_id,
            qty: item.qty,
            alasan_retur: item.alasan_retur,
          },
        });
      }

      if (data.invoice_outlet_id) {
        const piutang = await tx.kartuPiutangOutlet.findUnique({
          where: { invoice_outlet_id: data.invoice_outlet_id },
        });

        if (piutang) {
          if (data.total_nilai_retur > Number(piutang.sisa_piutang)) {
             throw new BadRequestException(`Nilai retur (${data.total_nilai_retur}) melebihi sisa piutang (${piutang.sisa_piutang})`);
          }
          
          await tx.alokasiReturPiutang.create({
            data: {
              invoice_retur_produk_id: retur.id,
              kartu_piutang_outlet_id: piutang.id,
              nominal_potongan: data.total_nilai_retur,
            },
          });

          await tx.kartuPiutangOutlet.update({
            where: { id: piutang.id },
            data: { sisa_piutang: { decrement: data.total_nilai_retur } },
          });
        }
      }
      return retur;
    });
  }
  
  async findAll() {
    return this.prisma.invoiceReturProduk.findMany({
      where: { is_deleted: false },
      include: { outlet: true, detailInvoiceReturs: true, alokasiReturPiutangs: true },
    });
  }
}