import { Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePembayaranDto } from './dto/pembayaran.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentReceivedEvent } from './events/payment-received.event';
import { hashPayload, validateReplayPayload } from '../../common/utils/idempotency.util';
import { CodeGeneratorService } from '../../common/services/code-generator.service';

@Injectable()
export class PembayaranService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private eventEmitter: EventEmitter2,
    private codeGenerator: CodeGeneratorService,
  ) { }

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

  async create(data: CreatePembayaranDto, user: AuthenticatedUser, idempotencyKey?: string) {
    const payloadHash = hashPayload(data);
    const maxRetries = 15;
    let attempt = 0;
    const documentDate = new Date();

    const scopedKey = idempotencyKey ? `${user.id}-${idempotencyKey}` : undefined;

    if (scopedKey) {
      const existing = await this.prisma.pembayaranInvoice.findUnique({
        where: { idempotency_key: scopedKey },
        include: { invoiceOutlet: true }
      });
      if (existing) {
        validateReplayPayload(existing.payload_hash, payloadHash);
        return existing;
      }
    }

    while (attempt < maxRetries) {
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          const invoice = await tx.invoiceOutlet.findUnique({
            where: { id: data.invoice_outlet_id },
            include: { outlet: true, salesKanvasPlan: true },
          });

          // 🔥 FIX 1: Hanya DRAFT yang boleh dibayar (selain DRAFT ditolak)
          if (!invoice || invoice.status !== 'DRAFT') {
            throw new NotFoundException('Invoice tidak ditemukan atau status tidak valid untuk pembayaran');
          }

          const roleName = user.role.name.toLowerCase();
          const isGlobalRole = ['superadmin', 'super admin', 'kasir', 'supervisor'].includes(roleName);
          if (!isGlobalRole && roleName.includes('sales')) {
            if (invoice.salesKanvasPlan?.user_id !== user.id) {
              throw new NotFoundException('Invoice tidak ditemukan');
            }
          }

          const tglBayar = new Date(data.tgl_bayar);
          const tglInvoice = new Date(invoice.tgl_invoice);
          const today = new Date();

          tglBayar.setHours(0, 0, 0, 0);
          tglInvoice.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          if (tglBayar > today) {
            throw new BadRequestException('Tanggal pembayaran tidak boleh di masa depan.');
          }
          if (tglBayar < tglInvoice) {
            throw new BadRequestException('Tanggal pembayaran tidak boleh sebelum tanggal invoice terbit.');
          }

          const kartuPiutang = await tx.kartuPiutangOutlet.findUnique({
            where: { invoice_outlet_id: data.invoice_outlet_id },
          });

          if (!kartuPiutang) {
            throw new NotFoundException('Kartu Piutang tidak ditemukan untuk invoice ini');
          }

          if (data.nominal_bayar > kartuPiutang.sisa_piutang.toNumber()) {
            throw new BadRequestException('Nominal bayar melebihi sisa piutang');
          }

          const documentNumber = await this.codeGenerator.generate(tx, 'KW', documentDate);

          const pembayaran = await tx.pembayaranInvoice.create({
            data: {
              invoice_outlet_id: data.invoice_outlet_id,
              document_number: documentNumber,
              nominal_bayar: data.nominal_bayar,
              tipe_bayar: data.tipe_bayar,
              tgl_bayar: new Date(data.tgl_bayar),
              idempotency_key: scopedKey, // Menggunakan scopedKey
              payload_hash: payloadHash,
            },
          });

          const sisaPiutangBaru = kartuPiutang.sisa_piutang.toNumber() - data.nominal_bayar;

          await tx.kartuPiutangOutlet.update({
            where: { id: kartuPiutang.id },
            data: { sisa_piutang: sisaPiutangBaru },
          });

          await this.auditLog.log({
            user_id: user.id,
            action: 'CREATE_PAYMENT',
            entity: 'PembayaranInvoice',
            entity_id: pembayaran.id,
            new_values: {
              invoice_id: data.invoice_outlet_id,
              nominal_bayar: data.nominal_bayar,
              tipe_bayar: data.tipe_bayar,
              sisa_piutang_akhir: sisaPiutangBaru,
              document_number: documentNumber,
            },
          }, tx);

          return {
            pembayaran,
            salesUserId: invoice.salesKanvasPlan?.user_id,
            outletName: invoice.outlet.nama_toko
          };
        }, { isolationLevel: 'Serializable' });

        if (result.salesUserId) {
          const actor = await this.prisma.user.findUnique({ where: { id: user.id } });
          this.eventEmitter.emit(
            "payment.received",
            new PaymentReceivedEvent(
              data.invoice_outlet_id,
              result.outletName,
              data.nominal_bayar,
              result.salesUserId,
              user.id,
              actor?.name || "Kasir",
            ),
          );
        }

        return result.pembayaran;
      } catch (error: any) {
        // 🔥 FIX 2: Fallback untuk data lama & scopedKey
        if (scopedKey) {
          const existing = await this.prisma.pembayaranInvoice.findUnique({
            where: { idempotency_key: scopedKey },
            include: { invoiceOutlet: true }
          });
          if (existing) {
            validateReplayPayload(existing.payload_hash, payloadHash);
            return existing;
          }
          // Fallback: Cek key lama tanpa scope (untuk kompatibilitas data historis jika ada)
          if (idempotencyKey) {
            const legacy = await this.prisma.pembayaranInvoice.findUnique({
              where: { idempotency_key: idempotencyKey },
              include: { invoiceOutlet: true }
            });
            if (legacy) {
              validateReplayPayload(legacy.payload_hash, payloadHash);
              return legacy;
            }
          }
        }

        if (this.isRetryableSerializationError(error)) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new ServiceUnavailableException("Sistem sedang sibuk (Database Conflict), silakan coba beberapa saat lagi.");
          }
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          continue;
        }
        throw error;
      }
    }
  }

  async findAll() {
    return this.prisma.pembayaranInvoice.findMany({
      where: { is_deleted: false },
      include: {
        invoiceOutlet: {
          include: { outlet: true, salesKanvasPlan: true }
        }
      },
      orderBy: { updated_at: 'desc' },
    });
  }
}