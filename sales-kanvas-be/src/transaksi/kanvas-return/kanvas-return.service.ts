import { Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKanvasReturnDto } from './dto/kanvas-return.dto';
import { ReceiveKanvasReturnDto } from './dto/receive-kanvas-return.dto';
import { hashPayload, validateReplayPayload } from '../../common/utils/idempotency.util';
import { CodeGeneratorService } from '../../common/services/code-generator.service';

@Injectable()
export class KanvasReturnService {
  constructor(
    private prisma: PrismaService,
    private codeGenerator: CodeGeneratorService, // 🔥 Inject
  ) {}

  private isRetryableSerializationError(error: any): boolean {
    if (error?.code === 'P2034') return true;
    if (error?.code !== 'P2010') return false;
    
    const meta = error?.meta;
    if (!meta) return false;

    const directCode = typeof meta === 'object' ? (meta.code ?? meta.sqlState) : null;
    if (directCode === '40001' || directCode === '40P01') return true;

    const nestedCode = meta?.cause?.originalCode || meta?.driverAdapterError?.cause?.originalCode;
    if (nestedCode === '40001' || nestedCode === '40P01') return true;

    return false;
  }

  async create(data: CreateKanvasReturnDto, userId: number, ip: string, idempotencyKey?: string) {
    const payloadHash = hashPayload(data);
    const maxRetries = 15; // 🔥 Naikkan limit
    let attempt = 0;
    const documentDate = new Date(); // 🔥 Tentukan SEKALI

    const scopedKey = idempotencyKey ? `${userId}-${idempotencyKey}` : undefined;

    // Pre-check Idempotency
    if (scopedKey) {
      const existing = await this.prisma.kanvasReturn.findUnique({
        where: { idempotency_key: scopedKey },
        include: { details: true },
      });
      if (existing) {
        validateReplayPayload(existing.payload_hash, payloadHash);
        return existing;
      }
    }

    while (attempt < maxRetries) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const plan = await tx.salesKanvasPlan.findUnique({ where: { id: data.sales_kanvas_plan_id } });
          if (!plan) throw new NotFoundException('Plan tidak ditemukan');
          if (plan.status === 'BATAL') throw new BadRequestException('Plan sudah dibatalkan');

          const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_tujuan_id } });
          if (!gudang || gudang.is_deleted) throw new NotFoundException('Gudang tujuan tidak ditemukan');

          // 🔥 Generate Nomor RTS
          const documentNumber = await this.codeGenerator.generate(tx, 'RTS', documentDate);

          const kanvasReturn = await tx.kanvasReturn.create({
            data: {
              sales_kanvas_plan_id: data.sales_kanvas_plan_id,
              gudang_tujuan_id: data.gudang_tujuan_id,
              tgl_retur: new Date(data.tgl_retur),
              document_number: documentNumber, // 🔥 Simpan Nomor
              status: 'MENUNGGU_GUDANG', 
              user_id: userId,
              ip: ip,
              idempotency_key: scopedKey,
              payload_hash: payloadHash,
            },
          });

          for (const item of data.details) {
            const batch = await tx.batch.findUnique({ where: { id: item.batch_id } });
            if (!batch || batch.is_deleted) throw new BadRequestException(`Batch ID ${item.batch_id} tidak ditemukan`);

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
        // Fallback Idempotency
        if (scopedKey) {
          const existing = await this.prisma.kanvasReturn.findUnique({
            where: { idempotency_key: scopedKey },
            include: { details: true },
          });
          if (existing) {
            validateReplayPayload(existing.payload_hash, payloadHash);
            return existing;
          }
        }

        // Retry Mechanism
        if (this.isRetryableSerializationError(error)) {
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
    const maxRetries = 15;
    let attempt = 0;

    const scopedKey = idempotencyKey ? `RECV-${userId}-${idempotencyKey}` : undefined;

    // Pre-check Idempotency (Menggunakan ReturReceipt)
    if (scopedKey) {
      const existingReceipt = await this.prisma.returReceipt.findUnique({
        where: { idempotency_key: scopedKey },
      });
      if (existingReceipt) {
        validateReplayPayload(existingReceipt.payload_hash, payloadHash);
        return { success: true, message: 'Penerimaan retur berhasil diproses (Replay)' };
      }
    }

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
            if (!dbDetail) throw new NotFoundException(`Detail ID ${reqDetail.detail_id} tidak ditemukan`);

            const sisaBelumDiterima = dbDetail.qty - dbDetail.qty_diterima;
            if (reqDetail.qty_diterima > sisaBelumDiterima) {
              throw new BadRequestException(`Penerimaan melebihi batas. Sisa: ${sisaBelumDiterima}`);
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
                  keterangan: `Penerimaan Retur Gudang #${kanvasReturn.document_number} (Bagus)`,
                },
              });
            } else {
               await tx.mutasiBatch.create({
                data: {
                  batch_id: dbDetail.batch_id,
                  tipe_mutasi: 'IN_RUSAK', 
                  qty: reqDetail.qty_diterima,
                  keterangan: `Penerimaan Retur Gudang #${kanvasReturn.document_number} (${reqDetail.kondisi})`,
                },
              });
            }
          }

          // 🔥 Simpan Receipt untuk Idempotency
          if (scopedKey) {
            await tx.returReceipt.create({
              data: {
                kanvas_return_id: id,
                idempotency_key: scopedKey,
                payload_hash: payloadHash,
                user_id: userId,
              }
            });
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
        // Fallback Idempotency
        if (scopedKey) {
          const existingReceipt = await this.prisma.returReceipt.findUnique({
            where: { idempotency_key: scopedKey },
          });
          if (existingReceipt) {
            validateReplayPayload(existingReceipt.payload_hash, payloadHash);
            return { success: true, message: 'Penerimaan retur berhasil diproses (Replay)' };
          }
        }

        if (this.isRetryableSerializationError(error)) {
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