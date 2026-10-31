import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { PaymentReceivedEvent } from '../../transaksi/pembayaran/events/payment-received.event';
import { NOTIF_TYPE, ENTITY_TYPE } from '../../common/constants/notification.constant';

@Injectable()
export class PaymentNotificationListener {
  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent('payment.received')
  async handlePaymentReceived(event: PaymentReceivedEvent) {
    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(event.nominalBayar);

    await this.notifications.createAndSend({
      user_id: event.salesUserId,
      actor_id: event.actorId,
      type: NOTIF_TYPE.PAYMENT_RECEIVED,
      title: "Pembayaran Diterima",
      message: `Pembayaran ${formattedAmount} untuk Invoice #${event.invoiceId} dari outlet ${event.outletName} telah dicatat oleh ${event.actorName}.`,
      entity_type: ENTITY_TYPE.INVOICE,
      entity_id: event.invoiceId,
    });
  }
}