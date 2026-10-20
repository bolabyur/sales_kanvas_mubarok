import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdukOutDto } from './dto/produk-out.dto';

@Injectable()
export class ProdukOutService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProdukOutDto) {
    return this.prisma.$transaction(async (tx) => {
      const bon = await tx.kasbonProduk.findUnique({
        where: { id: data.kasbon_produk_id },
        include: { detailKasbonProduks: true },
      });

      if (!bon) throw new NotFoundException('BON Kasbon Produk tidak ditemukan');
      if (bon.status === 'Loaded') throw new BadRequestException('BON ini sudah diproses (Loading)');

      const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_id } });
      if (!gudang) throw new BadRequestException('Gudang ID tidak ditemukan');

      const produkOut = await tx.produkOut.create({
        data: {
          kasbon_produk_id: data.kasbon_produk_id,
          gudang_id: data.gudang_id,
          tgl_keluar: new Date(data.tgl_keluar),
        },
      });

      for (const item of bon.detailKasbonProduks) {
        await tx.detailProdukOut.create({
          data: {
            produk_out_id: produkOut.id,
            produk_id: item.produk_id,
            batch_id: item.batch_id,
            qty: item.qty_bawa,
          },
        });

        await tx.batch.update({
          where: { id: item.batch_id },
          data: { stok_gudang: { decrement: item.qty_bawa } },
        });

        await tx.mutasiBatch.create({
          data: {
            batch_id: item.batch_id,
            tipe_mutasi: 'OUT',
            qty: item.qty_bawa,
            keterangan: `Loading ke Truk (BON #${bon.id})`,
          },
        });
      }

      await tx.kasbonProduk.update({
        where: { id: bon.id },
        data: { status: 'Loaded' },
      });

      return produkOut;
    });
  }

  async findAll() {
    return this.prisma.produkOut.findMany({
      where: { is_deleted: false },
      include: { kasbonProduk: true, detailProdukOuts: { include: { produk: true, batch: true } } },
    });
  }
}