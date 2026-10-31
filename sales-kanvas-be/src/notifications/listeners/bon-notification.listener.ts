import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BonCreatedEvent } from '../../transaksi/kasbon-produk/events/bon-created.event';
import { NOTIF_TYPE, ENTITY_TYPE } from '../../common/constants/notification.constant';

@Injectable()
export class BonNotificationListener {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('bon.created')
  async handleBonCreated(event: BonCreatedEvent) {
    const gudangs = await this.prisma.user.findMany({
      where: { role: { name: "Admin Gudang Distribusi" }, is_active: true },
    });

    for (const gudang of gudangs) {
      await this.notifications.createAndSend({
        user_id: gudang.id,
        actor_id: event.actorId,
        type: NOTIF_TYPE.BON_CREATED,
        title: "BON Baru Masuk",
        message: `BON #${event.bonId} dari ${event.actorName} (Plan: ${event.planInvoice}) menunggu proses pengambilan barang.`,
        entity_type: ENTITY_TYPE.BON,
        entity_id: event.bonId,
      });
    }
  }
}