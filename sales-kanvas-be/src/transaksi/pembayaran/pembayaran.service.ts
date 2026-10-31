import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePembayaranDto } from './dto/pembayaran.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { EventEmitter2 } from '@nestjs/event-emitter'; 
import { PaymentReceivedEvent } from './events/payment-received.event'; 

@Injectable()
export class PembayaranService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService, 
    private eventEmitter: EventEmitter2, 
  ) {}

  async create(data: CreatePembayaranDto, user: AuthenticatedUser) {
    const result = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoiceOutlet.findUnique({
        where: { id: data.invoice_outlet_id },
        include: { outlet: true, salesKanvasPlan: true },
      });

      if (!invoice) throw new NotFoundException('Invoice tidak ditemukan');

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

      const pembayaran = await tx.pembayaranInvoice.create({
        data: {
          invoice_outlet_id: data.invoice_outlet_id,
          nominal_bayar: data.nominal_bayar,
          tipe_bayar: data.tipe_bayar,
          tgl_bayar: new Date(data.tgl_bayar),
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