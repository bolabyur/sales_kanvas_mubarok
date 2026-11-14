import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSettlementDto } from './dto/settlement.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SettlementSubmittedEvent } from './events/settlement-submitted.event';
import { CodeGeneratorService } from '../../common/services/code-generator.service';
import { hashPayload, validateReplayPayload } from '../../common/utils/idempotency.util';
import { PLAN_STATUS } from '../../plan/dto/plan.dto';

// W1=B': Settlement hanya boleh untuk Plan berstatus SELESAI.
// Legacy 'Settled' (mixed-case) tetap ditulis ke plan.status setelah settle.
const SETTLEABLE_STATUS = PLAN_STATUS.SELESAI;
const SETTLED_STATUS = 'Settled'; // preserved historical mixed-case value

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
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

  async create(data: CreateSettlementDto, userId: number, idempotencyKey?: string) {
    const payloadHash = hashPayload(data);
    const maxRetries = 15;
    let attempt = 0;
    const scopedKey = idempotencyKey ? `${userId}-${idempotencyKey}` : undefined;

    // documentDate ditentukan SEKALI sebelum retry loop
    const tglSettlement = new Date();

    // 1. Pre-check idempotency
    if (scopedKey) {
      const existing = await this.prisma.settlement.findUnique({
        where: { idempotency_key: scopedKey },
        include: {
          salesKanvasPlan: { select: { invoice: true, tgl_pergi_kanvas: true } },
          approver: { select: { name: true } },
        },
      });
      if (existing) {
        validateReplayPayload(existing.payload_hash, payloadHash);
        return existing;
      }
    }

    while (attempt < maxRetries) {
      try {
        const result = await this.prisma.$transaction(
          async (tx) => {
            const plan = await tx.salesKanvasPlan.findUnique({
              where: { id: data.sales_kanvas_plan_id },
              include: {
                invoiceOutlets: true,
                kasbonOperasionals: true,
                settlements: { where: { is_deleted: false } },
              },
            });

            if (!plan) throw new NotFoundException('Rencana Kanvas tidak ditemukan');
            if (plan.settlements.length > 0) {
              throw new BadRequestException('Plan ini sudah di-settle');
            }

            // W1=B': whitelist SELESAI — tolak semua status lain
            if (plan.status !== SETTLEABLE_STATUS) {
              throw new BadRequestException(
                `Hanya Plan dengan status SELESAI yang dapat di-settle. Status saat ini: ${plan.status}`,
              );
            }

            // Hitung agregat Decimal-safe
            let totalPenjualanTunai = new Prisma.Decimal(0);
            let totalPiutangBaru = new Prisma.Decimal(0);
            for (const inv of plan.invoiceOutlets) {
              if ((inv as any).is_deleted) continue;
              const total = new Prisma.Decimal(inv.total_tagihan);
              if (inv.tipe_pembayaran === 'Tunai') {
                totalPenjualanTunai = totalPenjualanTunai.plus(total);
              } else {
                totalPiutangBaru = totalPiutangBaru.plus(total);
              }
            }

            let totalKasbonRealisasi = new Prisma.Decimal(0);
            for (const kasbon of plan.kasbonOperasionals) {
              if ((kasbon as any).is_deleted) continue;
              totalKasbonRealisasi = totalKasbonRealisasi.plus(
                new Prisma.Decimal(kasbon.nominal_kasbon),
              );
            }

            // W2=A: Settlement = reconciliation snapshot.
            // Positive/negative selisih_kas recorded but does NOT block settlement.
            // 'Settled' status does NOT imply full payment — admin must review
            // selisih_kas manually. Threshold/approval workflow deferred to TD5.
            const uangFisik = new Prisma.Decimal(data.uang_fisik_diterima);
            const uangSeharusnyaDisetor = totalPenjualanTunai.plus(totalKasbonRealisasi);
            const selisihKas = uangFisik.minus(uangSeharusnyaDisetor);

            // Generate STL number dalam transaction
            const documentNumber = await this.codeGenerator.generate(
              tx,
              'STL',
              tglSettlement,
            );

            const settlement = await tx.settlement.create({
              data: {
                sales_kanvas_plan_id: data.sales_kanvas_plan_id,
                total_penjualan_tunai: totalPenjualanTunai,
                total_piutang_baru: totalPiutangBaru,
                total_kasbon_realisasi: totalKasbonRealisasi,
                uang_fisik_diterima: uangFisik,
                selisih_kas: selisihKas,
                status: 'Closed',
                approved_by: null,
                user_id: userId,
                tgl_settlement: tglSettlement,
                document_number: documentNumber,
                idempotency_key: scopedKey,
                payload_hash: payloadHash,
              },
            });

            // Conditional update — race-safe. Hanya SELESAI yang boleh transisi ke Settled.
            const updated = await tx.salesKanvasPlan.updateMany({
              where: {
                id: plan.id,
                status: SETTLEABLE_STATUS,
              },
              data: { status: SETTLED_STATUS },
            });

            if (updated.count === 0) {
              throw new ConflictException('Plan sudah di-settle oleh request lain');
            }

            return {
              settlement,
              planInvoice: plan.invoice,
              totalPenjualanTunai: Number(totalPenjualanTunai),
            };
          },
          { isolationLevel: 'Serializable' },
        );

        // Emit event setelah commit
        try {
          const actor = await this.prisma.user.findUnique({ where: { id: userId } });
          this.eventEmitter.emit(
            'settlement.submitted',
            new SettlementSubmittedEvent(
              result.settlement.id,
              result.planInvoice,
              result.totalPenjualanTunai,
              userId,
              actor?.name || 'Sales',
            ),
          );
        } catch (eventErr) {
          this.logger.error(
            `[SETTLEMENT-EVENT-FAILED] settlementId=${result.settlement.id}`,
            eventErr,
          );
        }

        return result.settlement;
      } catch (error: any) {
        // Idempotency fallback (race)
        if (scopedKey) {
          const existing = await this.prisma.settlement.findUnique({
            where: { idempotency_key: scopedKey },
            include: {
              salesKanvasPlan: { select: { invoice: true, tgl_pergi_kanvas: true } },
            },
          });
          if (existing) {
            validateReplayPayload(existing.payload_hash, payloadHash);
            return existing;
          }
        }

        // P2002 unique violation → konflik bisnis
        if (error?.code === 'P2002') {
          const target = error.meta?.target;
          if (
            (Array.isArray(target) &&
              target.some((t: string) => t.includes('sales_kanvas_plan_id'))) ||
            target === 'settlement_sales_kanvas_plan_id_active_key'
          ) {
            throw new ConflictException('Plan ini sudah di-settle');
          }
          if (
            (Array.isArray(target) && target.includes('idempotency_key')) ||
            target === 'settlement_idempotency_key_key'
          ) {
            throw new ConflictException('Konflik idempotency key');
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

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const whereClause: any = { is_deleted: false };

    if (search) {
      whereClause.OR = [
        { document_number: { contains: search, mode: 'insensitive' } },
        { salesKanvasPlan: { invoice: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where: whereClause,
        include: {
          salesKanvasPlan: { select: { invoice: true, tgl_pergi_kanvas: true } },
          approver: { select: { name: true } },
        },
        skip,
        take: limit,
        orderBy: { updated_at: 'desc' },
      }),
      this.prisma.settlement.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }
}