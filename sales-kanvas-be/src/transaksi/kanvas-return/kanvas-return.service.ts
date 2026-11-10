import { Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKanvasReturnDto } from './dto/kanvas-return.dto';
import { ReceiveKanvasReturnDto } from './dto/receive-kanvas-return.dto';
import { hashPayload, validateReplayPayload } from '../../common/utils/idempotency.util';

@Injectable()
export class KanvasReturnService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateKanvasReturnDto, userId: number, ip: string, idempotencyKey?: string) {
    const payloadHash = hashPayload(data);
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const plan = await tx.salesKanvasPlan.findUnique({ where: { id: data.sales_kanvas_plan_id } });
          if (!plan) throw new NotFoundException('Plan tidak ditemukan');

          const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_tujuan_id } });
          if (!gudang) throw new NotFoundException('Gudang tujuan tidak ditemukan');

          const kanvasReturn = await tx.kanvasReturn.create({
            data: {
              sales_kanvas_plan_id: data.sales_kanvas_plan_id,
              gudang_tujuan_id: data.gudang_tujuan_id,
              tgl_retur: new Date(data.tgl_retur),
              status: 'MENUNGGU_GUDANG', 
              user_id: userId,
              ip: ip,
              idempotency_key: idempotencyKey,
              payload_hash: payloadHash,
            },
          });

          for (const item of data.details) {
            const batch = await tx.batch.findUnique({ where: { id: item.batch_id } });
            if (!batch) throw new BadRequestException(`Batch ID ${item.batch_id} tidak ditemukan`);

            await tx.kanvasReturnDetail.create({
              data: {
                kanvas_return_id: kanvasReturn.id,
                batch_id: item.batch_id,
                produk_id: item.produk_id,
                qty: item.qty,
                kondisi: item.kondisi,
                alasan: item.alasan,
                qty_diterima: 0, 
              },
            });
          }

          return kanvasReturn;
        }, { isolationLevel: 'Serializable' });
      } catch (error: any) {
        if (idempotencyKey) {
          const existing = await this.prisma.kanvasReturn.findUnique({
            where: { idempotency_key: idempotencyKey },
            include: { details: true },
          });
          if (existing) {
            validateReplayPayload(existing.payload_hash, payloadHash);
            return existing;
          }
        }
        if (error.code === 'P2034') {
          attempt++;
          if (attempt >= maxRetries) throw new ServiceUnavailableException('Sistem sibuk (Database Conflict)');
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          continue;
        }
        throw error;
      }
    }
  }

  async receive(id: number, data: ReceiveKanvasReturnDto, userId: number, ip: string, idempotencyKey?: string) {
    const payloadHash = hashPayload(data);
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const kanvasReturn = await tx.kanvasReturn.findUnique({
            where: { id, is_deleted: false },
            include: { details: true },
          });

          if (!kanvasReturn) throw new NotFoundException('Retur tidak ditemukan');
          if (kanvasReturn.status === 'DITERIMA') throw new BadRequestException('Retur ini sudah diterima seluruhnya');

          for (const reqDetail of data.details) {
            const dbDetail = kanvasReturn.details.find(d => d.id === reqDetail.detail_id);
            if (!dbDetail) throw new NotFoundException(`Detail ID ${reqDetail.detail_id} tidak ditemukan dalam retur ini`);

            const sisaBelumDiterima = dbDetail.qty - dbDetail.qty_diterima;
            if (reqDetail.qty_diterima > sisaBelumDiterima) {
              throw new BadRequestException(`Penerimaan melebihi batas. Sisa yang belum diterima untuk detail ${reqDetail.detail_id} adalah ${sisaBelumDiterima}`);
            }

            await tx.kanvasReturnDetail.update({
              where: { id: reqDetail.detail_id },
              data: { 
                qty_diterima: { increment: reqDetail.qty_diterima },
                kondisi: reqDetail.kondisi 
              },
            });

            if (reqDetail.kondisi === 'BAGUS') {
              await tx.batch.update({
                where: { id: dbDetail.batch_id },
                data: { stok_gudang: { increment: reqDetail.qty_diterima } },
              });

              await tx.mutasiBatch.create({
                data: {
                  batch_id: dbDetail.batch_id,
                  tipe_mutasi: 'IN',
                  qty: reqDetail.qty_diterima,
                  keterangan: `Penerimaan Retur Gudang #${kanvasReturn.id} (Kondisi: Bagus)`,
                },
              });
            } else {
               await tx.mutasiBatch.create({
                data: {
                  batch_id: dbDetail.batch_id,
                  tipe_mutasi: 'IN_RUSAK', 
                  qty: reqDetail.qty_diterima,
                  keterangan: `Penerimaan Retur Gudang #${kanvasReturn.id} (Kondisi: ${reqDetail.kondisi})`,
                },
              });
            }
          }

          const updatedDetails = await tx.kanvasReturnDetail.findMany({ where: { kanvas_return_id: id } });
          const isFullyReceived = updatedDetails.every(d => d.qty_diterima >= d.qty);
          
          if (isFullyReceived) {
            await tx.kanvasReturn.update({
              where: { id },
              data: { status: 'DITERIMA' },
            });
          }

          return { success: true, message: 'Penerimaan retur berhasil diproses' };
        }, { isolationLevel: 'Serializable' }); 
        
      } catch (error: any) {
        if (error.code === 'P2034') {
          attempt++;
          if (attempt >= maxRetries) throw new ServiceUnavailableException('Sistem sibuk (Database Conflict)');
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          continue;
        }
        throw error;
      }
    }
  }

  async findAll() {
    return this.prisma.kanvasReturn.findMany({
      where: { is_deleted: false },
      include: {
        salesKanvasPlan: true,
        gudangTujuan: true,
        details: { include: { produk: true, batch: true } },
      },
      orderBy: { id: 'desc' },
    });
  }
}