import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdukOutDto } from './dto/produk-out.dto';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { EventEmitter2 } from '@nestjs/event-emitter'; // ✅
import { LoadingCompletedEvent } from './events/loading-completed.event'; // ✅

@Injectable()
export class ProdukOutService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private eventEmitter: EventEmitter2, // ✅
  ) {}

  private async allocateFefo(tx: any, produk_id: number, qty: number): Promise<Array<{ batch_id: number; qty: number; no_batch: string }>> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const batches = await tx.batch.findMany({
      where: {
        produk_id,
        is_deleted: false,
        stok_gudang: { gt: 0 },
        expired_date: { gte: startOfToday },
      },
      orderBy: { expired_date: 'asc' },
    });

    let remaining = qty;
    const allocs: Array<{ batch_id: number; qty: number; no_batch: string }> = [];
    for (const b of batches) {
      if (remaining <= 0) break;
      const take = Math.min(b.stok_gudang, remaining);
      allocs.push({ batch_id: b.id, qty: take, no_batch: b.no_batch });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new BadRequestException(
        `Stok FEFO tidak cukup untuk produk ID ${produk_id}. Kurang ${remaining} unit (batch dengan ED aktif).`,
      );
    }
    return allocs;
  }

  async create(data: CreateProdukOutDto, userId: number, ip: string) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const bon = await tx.kasbonProduk.findUnique({
          where: { id: data.kasbon_produk_id },
          include: { detailKasbonProduks: true },
        });

        if (!bon || bon.is_deleted) throw new NotFoundException('BON Kasbon Produk tidak ditemukan');
        if (bon.status === 'ONLOADING' || bon.status === 'Loaded') throw new BadRequestException('BON ini sudah Onloading');
        if (bon.status === 'BATAL') throw new BadRequestException('BON sudah dibatalkan');
        if (bon.detailKasbonProduks.length === 0) throw new BadRequestException('BON ini tidak memiliki detail barang');

        const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_id } });
        if (!gudang || gudang.is_deleted) throw new NotFoundException('Gudang ID tidak ditemukan');

        const produkOut = await tx.produkOut.create({
          data: {
            kasbon_produk_id: data.kasbon_produk_id,
            gudang_id: data.gudang_id,
            tgl_keluar: new Date(data.tgl_keluar),
            source_type: data.source_type,
            user_id: userId,
            ip,
          },
        });

        for (const item of bon.detailKasbonProduks) {
          const allocations = await this.allocateFefo(tx, item.produk_id, item.qty_bawa);

          for (const alloc of allocations) {
            const res = await tx.batch.updateMany({
              where: { id: alloc.batch_id, is_deleted: false, stok_gudang: { gte: alloc.qty } },
              data: { stok_gudang: { decrement: alloc.qty } },
            });

            if (res.count === 0) {
              throw new BadRequestException(`Stok batch ${alloc.no_batch} mendadak tidak mencukupi. Coba ulangi.`);
            }

            await tx.detailProdukOut.create({
              data: {
                produk_out_id: produkOut.id,
                produk_id: item.produk_id,
                batch_id: alloc.batch_id,
                qty: alloc.qty,
              },
            });

            await tx.mutasiBatch.create({
              data: {
                batch_id: alloc.batch_id,
                tipe_mutasi: 'OUT',
                qty: alloc.qty,
                keterangan: `Onloading BON #${bon.id} (FEFO Auto)`,
              },
            });
          }
        }

        await tx.kasbonProduk.update({
          where: { id: bon.id },
          data: { status: 'ONLOADING' },
        });

        await this.auditLog.log(
          {
            user_id: userId,
            action: 'CREATE_ONLOADING',
            entity: 'ProdukOut',
            entity_id: produkOut.id,
            new_values: { bon_id: bon.id, source_type: data.source_type, fefo_applied: true },
          },
          tx,
        );

        return { 
          produkOut, 
          salesUserId: bon.user_id, 
          totalItems: bon.detailKasbonProduks.length 
        };
      },
      { isolationLevel: 'Serializable' },
    );

    // 🚀 TEMBAK EVENT SETELAH TRANSAKSI BERHASIL
    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    this.eventEmitter.emit(
      "loading.completed",
      new LoadingCompletedEvent(
        result.produkOut.kasbon_produk_id,
        result.salesUserId,
        result.totalItems,
        userId,
        actor?.name || "Admin Gudang",
      ),
    );

    return result.produkOut;
  }

  async cancel(id: number, userId: number, ip: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const produkOut = await tx.produkOut.findUnique({
          where: { id, is_deleted: false },
          include: { detailProdukOuts: true },
        });
        if (!produkOut) throw new NotFoundException('ProdukOut tidak ditemukan atau sudah dibatalkan');

        for (const detail of produkOut.detailProdukOuts) {
          await tx.batch.update({
            where: { id: detail.batch_id },
            data: { stok_gudang: { increment: detail.qty } },
          });
          await tx.mutasiBatch.create({
            data: {
              batch_id: detail.batch_id,
              tipe_mutasi: 'IN',
              qty: detail.qty,
              keterangan: `Batal Onloading ProdukOut #${produkOut.id}`,
            },
          });
        }

        await tx.produkOut.update({
          where: { id },
          data: { is_deleted: true },
        });

        await tx.kasbonProduk.update({
          where: { id: produkOut.kasbon_produk_id },
          data: { status: 'DRAFT' },
        });

        await this.auditLog.log(
          {
            user_id: userId,
            action: 'CANCEL_ONLOADING',
            entity: 'ProdukOut',
            entity_id: produkOut.id,
            old_values: { kasbon_produk_id: produkOut.kasbon_produk_id },
          },
          tx,
        );

        return tx.produkOut.findUniqueOrThrow({ where: { id } });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async findAll() {
    return this.prisma.produkOut.findMany({
      where: { is_deleted: false },
      include: {
        kasbonProduk: { 
          include: { 
            salesKanvasPlan: {
              include: { salesKanvasPersonil: { include: { employee: true } } }
            } 
          } 
        },
        detailProdukOuts: { include: { produk: true, batch: true } },
      },
      orderBy: { updated_at: 'desc' },
    });
  }
}