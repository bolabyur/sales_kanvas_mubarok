import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdukInDto } from './dto/produk-in.dto';

@Injectable()
export class ProdukInService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProdukInDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validasi Gudang
      const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_id } });
      if (!gudang || gudang.is_deleted) {
        throw new NotFoundException(`Gudang ID ${data.gudang_id} tidak ditemukan`);
      }

      // 2. Validasi Plan
      const plan = await tx.salesKanvasPlan.findUnique({
        where: { id: data.sales_kanvas_plan_id },
      });
      if (!plan) {
        throw new NotFoundException(`Sales Kanvas Plan ID ${data.sales_kanvas_plan_id} tidak ditemukan`);
      }

      // 3. Validasi: Cek apakah Plan ini sudah pernah di-Unloading
      // const existingProdukIn = await tx.produkIn.findFirst({
      //   where: { 
      //     sales_kanvas_plan_id: data.sales_kanvas_plan_id, 
      //     is_deleted: false 
      //   },
      // });
      // if (existingProdukIn) {
      //   throw new BadRequestException(
      //     `Plan ini sudah pernah di-Unloading (ID In: ${existingProdukIn.id}). Satu Plan hanya boleh di-Unloading satu kali.`
      //   );
      // }

      // 4. Validasi Produk
      const produkIds = [...new Set(data.details.map((d) => d.produk_id))];
      const produkList = await tx.product.findMany({
        where: { id: { in: produkIds }, is_active: true },
      });
      const produkFound = new Set(produkList.map((p) => p.id));
      const produkMissing = produkIds.filter((id) => !produkFound.has(id));
      if (produkMissing.length > 0) {
        throw new NotFoundException(
          `Produk ID [${produkMissing.join(', ')}] tidak ditemukan atau tidak aktif`
        );
      }

      // 5. Buat Header ProdukIn
      const produkIn = await tx.produkIn.create({
        data: {
          sales_kanvas_plan_id: data.sales_kanvas_plan_id,
          gudang_id: data.gudang_id,
          tgl_masuk: new Date(data.tgl_masuk),
          tipe_sumber: data.tipe_sumber,
        },
      });

      // 6. Iterasi Detail
      for (const item of data.details) {
        const existingBatch = await tx.batch.findUnique({
          where: {
            produk_id_no_batch: { produk_id: item.produk_id, no_batch: item.no_batch },
          },
        });

        let batchId: number;

        if (!existingBatch) {
          const newBatch = await tx.batch.create({
            data: {
              produk_id: item.produk_id,
              no_batch: item.no_batch,
              expired_date: new Date(item.expired_date),
              stok_gudang: 0,
            },
          });
          batchId = newBatch.id;
        } else {
          // Jika batch sudah ada, cek apakah ED-nya sama
          if (existingBatch.expired_date.getTime() !== new Date(item.expired_date).getTime()) {
            throw new BadRequestException(
              `Tanggal ED tidak sesuai dengan batch ${item.no_batch} yang sudah ada`
            );
          }
          batchId = existingBatch.id;
        }

        await tx.detailProdukIn.create({
          data: {
            produk_in_id: produkIn.id,
            produk_id: item.produk_id,
            batch_id: batchId,
            qty_sisa: item.qty_sisa,
            kondisi: item.kondisi,
          },
        });

        if (item.kondisi === 'Bagus') {
          await tx.batch.update({
            where: { id: batchId },
            data: { stok_gudang: { increment: item.qty_sisa } },
          });
        }

        await tx.mutasiBatch.create({
          data: {
            batch_id: batchId,
            tipe_mutasi: 'IN',
            qty: item.qty_sisa,
            keterangan: `${data.tipe_sumber} (Kondisi: ${item.kondisi}) - Plan #${data.sales_kanvas_plan_id}`,
          },
        });
      }

      return tx.produkIn.findUniqueOrThrow({
        where: { id: produkIn.id },
        include: {
          salesKanvasPlan: true,
          detailProdukIns: { include: { produk: true, batch: true } },
        },
      });
    }, { isolationLevel: 'Serializable' });
  }

  async findAll() {
    return this.prisma.produkIn.findMany({
      where: { is_deleted: false },
      include: {
        salesKanvasPlan: true,
        detailProdukIns: { include: { produk: true, batch: true } },
      },
      orderBy: { updated_at: 'desc' },
    });
  }
}