import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdukOutDto } from './dto/produk-out.dto';

@Injectable()
export class ProdukOutService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProdukOutDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validasi BON
      const bon = await tx.kasbonProduk.findUnique({
        where: { id: data.kasbon_produk_id },
        include: { detailKasbonProduks: true },
      });

      if (!bon || bon.is_deleted) throw new NotFoundException('BON Kasbon Produk tidak ditemukan');
      if (bon.status === 'Loaded') throw new BadRequestException('BON ini sudah diproses (Loading)');
      if (bon.detailKasbonProduks.length === 0) throw new BadRequestException('BON ini tidak memiliki detail barang');

      // 2. Validasi Gudang
      const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_id } });
      if (!gudang || gudang.is_deleted) throw new NotFoundException('Gudang ID tidak ditemukan atau sudah dihapus');

      // 3. Buat Header ProdukOut
      const produkOut = await tx.produkOut.create({
        data: {
          kasbon_produk_id: data.kasbon_produk_id,
          gudang_id: data.gudang_id,
          tgl_keluar: new Date(data.tgl_keluar),
          tipe_sumber: data.tipe_sumber,
        },
      });

      // 4. Iterasi Barang dari BON
      for (const item of bon.detailKasbonProduks) {
        
        // Potong Stok dengan Validasi (Mencegah Stok Minus)
        const result = await tx.batch.updateMany({
          where: {
            id: item.batch_id,
            is_deleted: false,
            stok_gudang: { gte: item.qty_bawa }, // Stok harus >= Qty
          },
          data: { stok_gudang: { decrement: item.qty_bawa } },
        });

        if (result.count === 0) {
          const batchInfo = await tx.batch.findUnique({ where: { id: item.batch_id } });
          throw new BadRequestException(`Stok batch ${batchInfo?.no_batch || item.batch_id} tidak mencukupi untuk Loading`);
        }

        // Simpan Detail Produk Out
        await tx.detailProdukOut.create({
          data: {
            produk_out_id: produkOut.id,
            produk_id: item.produk_id,
            batch_id: item.batch_id,
            qty: item.qty_bawa,
          },
        });

        // Catat Mutasi Batch
        await tx.mutasiBatch.create({
          data: {
            batch_id: item.batch_id,
            tipe_mutasi: 'OUT',
            qty: item.qty_bawa,
            keterangan: `${data.tipe_sumber} (BON #${bon.id})`,
          },
        });
      }

      // 5. Ubah Status BON menjadi Loaded
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
        kasbonProduk: { 
          include: { 
            salesKanvasPlan: true // <-- Ini yang tadi bikin error karena kurang kurung kurawal
          } 
        }, 
        detailProdukOuts: { include: { produk: true, batch: true } } 
      },
      orderBy: { updated_at: 'desc' }
    });
  }
}