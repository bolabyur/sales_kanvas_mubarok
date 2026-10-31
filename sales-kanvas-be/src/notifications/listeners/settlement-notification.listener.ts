import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SettlementSubmittedEvent } from '../../transaksi/settlement/events/settlement-submitted.event';
import { NOTIF_TYPE, ENTITY_TYPE } from '../../common/constants/notification.constant';

@Injectable()
export class SettlementNotificationListener {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('settlement.submitted')
  async handleSettlementSubmitted(event: SettlementSubmittedEvent) {
    const kasirs = await this.prisma.user.findMany({
      where: { role: { name: "Kasir / Tim Keuangan" }, is_active: true },
    });

    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(event.totalAmount);

    for (const kasir of kasirs) {
      await this.notifications.createAndSend({
        user_id: kasir.id,
        actor_id: event.actorId,
        type: NOTIF_TYPE.SETTLEMENT_SUBMITTED,
        title: "Settlement Diajukan",
        message: `Setoran untuk Plan ${event.planInvoice} sebesar ${formattedAmount} telah diajukan oleh ${event.actorName}.`,
        entity_type: ENTITY_TYPE.SETTLEMENT,
        entity_id: event.settlementId,
      });
    }
  }
}