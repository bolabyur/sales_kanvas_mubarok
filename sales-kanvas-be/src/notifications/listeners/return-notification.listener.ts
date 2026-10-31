import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReturnSubmittedEvent } from '../../transaksi/retur/events/return-submitted.event';
import { ReturnApprovedEvent } from '../../transaksi/retur/events/return-approved.event';
import { NOTIF_TYPE, ENTITY_TYPE } from '../../common/constants/notification.constant';

@Injectable()
export class ReturnNotificationListener {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('return.submitted')
  async handleReturnSubmitted(event: ReturnSubmittedEvent) {
    const spvs = await this.prisma.user.findMany({
      where: { role: { name: "Supervisor Pemasaran" }, is_active: true },
    });

    for (const spv of spvs) {
      await this.notifications.createAndSend({
        user_id: spv.id,
        actor_id: event.actorId,
        type: NOTIF_TYPE.RETURN_SUBMITTED,
        title: "Pengajuan Retur Baru",
        message: `Retur #${event.returnId} dari ${event.actorName} untuk outlet ${event.outletName} menunggu persetujuan.`,
        entity_type: ENTITY_TYPE.RETURN,
        entity_id: event.returnId,
      });
    }
  }

  @OnEvent('return.approved')
  async handleReturnApproved(event: ReturnApprovedEvent) {
    await this.notifications.createAndSend({
      user_id: event.salesUserId,
      actor_id: event.actorId,
      type: NOTIF_TYPE.RETURN_APPROVED,
      title: "Retur Disetujui",
      message: `Retur #${event.returnId} telah disetujui oleh ${event.actorName}.`,
      entity_type: ENTITY_TYPE.RETURN,
      entity_id: event.returnId,
    });
  }
}