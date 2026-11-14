import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDestructionDto } from './dto/produk-destruction.dto';
import { hashPayload, validateReplayPayload } from '../../common/utils/idempotency.util';
import { CodeGeneratorService } from '../../common/services/code-generator.service';

@Injectable()
export class ProdukDestructionService {
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

  async create(data: CreateDestructionDto, userId: number, ip: string, idempotencyKey?: string) {
    const payloadHash = hashPayload(data);
    const maxRetries = 15;
    let attempt = 0;
    const scopedKey = idempotencyKey ? `${userId}-${idempotencyKey}` : undefined;

    // 🔥 FIX: documentDate ditentukan SEKALI sebelum retry loop
    const documentDate = new Date(data.tgl_destruction);

    // 1. Pre-check Idempotency
    if (scopedKey) {
      const existing = await this.prisma.produkDestruction.findUnique({
        where: { idempotency_key: scopedKey },
        include: { gudang: true, details: { include: { produk: true, batch: true } } },
      });
      if (existing) {
        validateReplayPayload(existing.payload_hash, payloadHash);
        return existing;
      }
    }

    while (attempt < maxRetries) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_id } });
            if (!gudang || gudang.is_deleted) {
              throw new NotFoundException('Gudang tidak ditemukan atau sudah dihapus');
            }

            // 🔥 FIX: Generate DSP number di dalam transaksi (atomic dengan header)
            const documentNumber = await this.codeGenerator.generate(tx, 'DSP', documentDate);

            const destruction = await tx.produkDestruction.create({
              data: {
                gudang_id: data.gudang_id,
                tgl_destruction: documentDate,
                alasan: data.alasan,
                status: 'DONE',
                user_id: userId,
                ip: ip,
                idempotency_key: scopedKey,
                payload_hash: payloadHash,
                document_number: documentNumber,
              },
            });

            for (const item of data.details) {
              const batch = await tx.batch.findUnique({ where: { id: item.batch_id } });
              if (!batch || batch.is_deleted) {
                throw new NotFoundException(`Batch ID ${item.batch_id} tidak ditemukan`);
              }
              if (batch.produk_id !== item.produk_id) {
                throw new BadRequestException(
                  `Batch ID ${item.batch_id} tidak sesuai dengan Produk ID ${item.produk_id}`
                );
              }

              const updatedBatch = await tx.batch.updateMany({
                where: { id: item.batch_id, stok_gudang: { gte: item.qty_dimusnahkan } },
                data: { stok_gudang: { decrement: item.qty_dimusnahkan } },
              });

              if (updatedBatch.count === 0) {
                throw new BadRequestException(
                  `Stok tidak mencukupi untuk Batch ID ${item.batch_id}. Diminta: ${item.qty_dimusnahkan}, Tersedia: ${batch.stok_gudang}`
                );
              }

              await tx.produkDestructionDetail.create({
                data: {
                  produk_destruction_id: destruction.id,
                  batch_id: item.batch_id,
                  produk_id: item.produk_id,
                  qty_dimusnahkan: item.qty_dimusnahkan,
                },
              });

              await tx.mutasiBatch.create({
                data: {
                  batch_id: item.batch_id,
                  tipe_mutasi: 'OUT',
                  qty: item.qty_dimusnahkan,
                  keterangan: `DESTRUCTION (Pemusnahan) - ${data.alasan}`,
                },
              });
            }

            return tx.produkDestruction.findUniqueOrThrow({
              where: { id: destruction.id },
              include: { gudang: true, details: { include: { produk: true, batch: true } } },
            });
          },
          { isolationLevel: 'Serializable' }
        );
      } catch (error: any) {
        // Fallback Idempotency
        if (scopedKey) {
          const existing = await this.prisma.produkDestruction.findUnique({
            where: { idempotency_key: scopedKey },
            include: { gudang: true, details: { include: { produk: true, batch: true } } },
          });
          if (existing) {
            validateReplayPayload(existing.payload_hash, payloadHash);
            return existing;
          }
        }

        // Retry
        if (this.isRetryableSerializationError(error)) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new ServiceUnavailableException('Sistem sibuk (Database Conflict)');
          }
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          continue;
        }
        throw error;
      }
    }
  }

  async findAll() {
    return this.prisma.produkDestruction.findMany({
      where: { is_deleted: false },
      include: {
        gudang: true,
        details: { include: { produk: true, batch: true } },
      },
      orderBy: { id: 'desc' },
    });
  }
}