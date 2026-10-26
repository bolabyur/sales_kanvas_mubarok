import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdukOutDto } from './dto/produk-out.dto';

@Injectable()
export class ProdukOutService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProdukOutDto, userId: number, ip: string) {
    return this.prisma.$transaction(async (tx) => {
      const bon = await tx.kasbonProduk.findUnique({
        where: { id: data.kasbon_produk_id },
        include: { detailKasbonProduks: true },
      });

      if (!bon || bon.is_deleted) throw new NotFoundException('BON Kasbon Produk tidak ditemukan');
      if (bon.status === 'Loaded') throw new BadRequestException('BON ini sudah diproses (Loading)');
      if (bon.detailKasbonProduks.length === 0) throw new BadRequestException('BON ini tidak memiliki detail barang');

      const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_id } });
      if (!gudang || gudang.is_deleted) throw new NotFoundException('Gudang ID tidak ditemukan atau sudah dihapus');

      const produkOut = await tx.produkOut.create({
        data: {
          kasbon_produk_id: data.kasbon_produk_id,
          gudang_id: data.gudang_id,
          tgl_keluar: new Date(data.tgl_keluar),
          source_type: data.source_type,
          user_id: userId,
          ip: ip,
        },
      });

      for (const item of bon.detailKasbonProduks) {
        const result = await tx.batch.updateMany({
          where: {
            id: item.batch_id,
            is_deleted: false,
            stok_gudang: { gte: item.qty_bawa },
          },
          data: { stok_gudang: { decrement: item.qty_bawa } },
        });

        if (result.count === 0) {
          const batchInfo = await tx.batch.findUnique({ where: { id: item.batch_id } });
          throw new BadRequestException(`Stok batch ${batchInfo?.no_batch || item.batch_id} tidak mencukupi untuk Loading`);
        }

        await tx.detailProdukOut.create({
          data: {
            produk_out_id: produkOut.id,
            produk_id: item.produk_id,
            batch_id: item.batch_id,
            qty: item.qty_bawa,
          },
        });

        await tx.mutasiBatch.create({
          data: {
            batch_id: item.batch_id,
            tipe_mutasi: 'OUT',
            qty: item.qty_bawa,
            keterangan: `${data.source_type} (BON #${bon.id})`,
          },
        });
      }

      await tx.kasbonProduk.update({
        where: { id: bon.id },
        data: { status: 'Loaded' },
      });

      return tx.produkOut.findUniqueOrThrow({
        where: { id: produkOut.id },
        include: {
          kasbonProduk: true,
          detailProdukOuts: { include: { produk: true, batch: true } },
        },
      });
    }, { isolationLevel: 'Serializable' });
  }

  async findAll() {
    return this.prisma.produkOut.findMany({
      where: { is_deleted: false },
      include: { 
        kasbonProduk: { include: { salesKanvasPlan: true } }, 
        detailProdukOuts: { include: { produk: true, batch: true } } 
      },
      orderBy: { updated_at: 'desc' }
    });
  }
}