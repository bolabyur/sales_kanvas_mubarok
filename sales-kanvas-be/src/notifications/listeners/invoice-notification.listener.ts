import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceCreatedEvent } from '../../transaksi/invoice/events/invoice-created.event';
import { InvoiceCancelledEvent } from '../../transaksi/invoice/events/invoice-cancelled.event';
import { NOTIF_TYPE, ENTITY_TYPE } from '../../common/constants/notification.constant';

@Injectable()
export class InvoiceNotificationListener {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('invoice.created')
  async handleInvoiceCreated(event: InvoiceCreatedEvent) {
    // 1. Cari semua user dengan role Kasir / Tim Keuangan
    const kasirs = await this.prisma.user.findMany({
      where: { role: { name: "Kasir / Tim Keuangan" }, is_active: true },
    });

    // 2. Format angka ke Rupiah
    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(event.totalAmount);

    // 3. Kirim notif ke semua kasir
    for (const kasir of kasirs) {
      await this.notifications.createAndSend({
        user_id: kasir.id,
        actor_id: event.actorId,
        type: NOTIF_TYPE.INVOICE_CREATED,
        title: "Invoice Baru Masuk",
        message: `Invoice #${event.invoiceId} untuk outlet ${event.outletName} senilai ${formattedAmount} telah dibuat oleh ${event.actorName}.`,
        entity_type: ENTITY_TYPE.INVOICE,
        entity_id: event.invoiceId,
      });
    }
  }

  @OnEvent('invoice.cancelled')
  async handleInvoiceCancelled(event: InvoiceCancelledEvent) {
    const kasirs = await this.prisma.user.findMany({
      where: { role: { name: "Kasir / Tim Keuangan" }, is_active: true },
    });

    for (const kasir of kasirs) {
      await this.notifications.createAndSend({
        user_id: kasir.id,
        actor_id: event.actorId,
        type: NOTIF_TYPE.INVOICE_CANCELLED,
        title: "Invoice Dibatalkan",
        message: `Invoice #${event.invoiceId} telah dibatalkan oleh ${event.actorName}.`,
        entity_type: ENTITY_TYPE.INVOICE,
        entity_id: event.invoiceId,
      });
    }
  }
}