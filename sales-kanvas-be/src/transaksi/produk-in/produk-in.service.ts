import { Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdukInDto } from './dto/produk-in.dto';
import { hashPayload, validateReplayPayload } from '../../common/utils/idempotency.util';
import { CodeGeneratorService } from '../../common/services/code-generator.service';

@Injectable()
export class ProdukInService {
  constructor(
    private prisma: PrismaService,
    private codeGenerator: CodeGeneratorService,
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

  async create(data: CreateProdukInDto, userId: number, ip: string, idempotencyKey?: string) {
    const payloadHash = hashPayload(data);
    const maxRetries = 15;
    let attempt = 0;
    
    // 🔥 FIX: Gunakan tanggal dari payload, bukan waktu sistem
    const documentDate = new Date(data.tgl_masuk); 

    const scopedKey = idempotencyKey ? `${userId}-${idempotencyKey}` : undefined;

    if (scopedKey) {
      const existing = await this.prisma.produkIn.findUnique({
        where: { idempotency_key: scopedKey },
        include: { detailProdukIns: true },
      });
      if (existing) {
        validateReplayPayload(existing.payload_hash, payloadHash);
        return existing;
      }
    }

    while (attempt < maxRetries) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_id } });
          if (!gudang || gudang.is_deleted) throw new NotFoundException(`Gudang ID ${data.gudang_id} tidak ditemukan`);

          if (data.source_type === 'SALES_KANVAS') {
            if (!data.sales_kanvas_plan_id) throw new BadRequestException('Plan ID wajib diisi untuk sumber SALES_KANVAS');
            const plan = await tx.salesKanvasPlan.findUnique({ where: { id: data.sales_kanvas_plan_id } });
            if (!plan) throw new NotFoundException(`Sales Kanvas Plan ID ${data.sales_kanvas_plan_id} tidak ditemukan`);
          }

          const produkIds = [...new Set(data.details.map((d) => d.produk_id))];
          const produkList = await tx.product.findMany({ where: { id: { in: produkIds }, is_active: true } });
          const produkFound = new Set(produkList.map((p) => p.id));
          const produkMissing = produkIds.filter((id) => !produkFound.has(id));
          if (produkMissing.length > 0) throw new NotFoundException(`Produk ID [${produkMissing.join(', ')}] tidak ditemukan`);

          // 🔥 Generator dipanggil di dalam transaksi dengan documentDate dari payload
          const documentNumber = await this.codeGenerator.generate(tx, 'ULD', documentDate);

          const produkIn = await tx.produkIn.create({
            data: {
              sales_kanvas_plan_id: data.sales_kanvas_plan_id || null,
              gudang_id: data.gudang_id,
              tgl_masuk: new Date(data.tgl_masuk),
              source_type: data.source_type,
              user_id: userId,
              ip: ip,
              idempotency_key: scopedKey,
              payload_hash: payloadHash,
              document_number: documentNumber,
            },
          });

          for (const item of data.details) {
            const existingBatch = await tx.batch.findUnique({
              where: { produk_id_no_batch: { produk_id: item.produk_id, no_batch: item.no_batch } },
            });

            let batchId: number;

            if (!existingBatch) {
              const newBatch = await tx.batch.create({
                data: { produk_id: item.produk_id, no_batch: item.no_batch, expired_date: new Date(item.expired_date), stok_gudang: 0 },
              });
              batchId = newBatch.id;
            } else {
              if (existingBatch.expired_date.getTime() !== new Date(item.expired_date).getTime()) {
                throw new BadRequestException(`Tanggal ED tidak sesuai dengan batch ${item.no_batch} yang sudah ada`);
              }
              batchId = existingBatch.id;
            }

            await tx.detailProdukIn.create({
              data: { produk_in_id: produkIn.id, produk_id: item.produk_id, batch_id: batchId, qty_sisa: item.qty_sisa, kondisi: item.kondisi },
            });

            if (item.kondisi === 'Bagus') {
              await tx.batch.update({ where: { id: batchId }, data: { stok_gudang: { increment: item.qty_sisa } } });
            }

            await tx.mutasiBatch.create({
              data: { batch_id: batchId, tipe_mutasi: 'IN', qty: item.qty_sisa, keterangan: `${data.source_type} (Kondisi: ${item.kondisi})` },
            });
          }

          return tx.produkIn.findUniqueOrThrow({
            where: { id: produkIn.id },
            include: { salesKanvasPlan: true, detailProdukIns: { include: { produk: true, batch: true } } },
          });
        }, { isolationLevel: 'Serializable' });
      } catch (error: any) {
        if (scopedKey) {
          const existing = await this.prisma.produkIn.findUnique({ where: { idempotency_key: scopedKey }, include: { detailProdukIns: true } });
          if (existing) {
            validateReplayPayload(existing.payload_hash, payloadHash);
            return existing;
          }
        }

        if (this.isRetryableSerializationError(error)) {
          attempt++;
          if (attempt >= maxRetries) throw new ServiceUnavailableException('Sistem sibuk (Database Conflict)');
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          continue;
        }
        throw error; // Error dari mock generator akan ditangkap di sini dan dilempar sebagai 500
      }
    }
  }

  async findAll() {
    return this.prisma.produkIn.findMany({
      where: { is_deleted: false },
      include: { salesKanvasPlan: true, detailProdukIns: { include: { produk: true, batch: true } } },
      orderBy: { updated_at: 'desc' },
    });
  }
}