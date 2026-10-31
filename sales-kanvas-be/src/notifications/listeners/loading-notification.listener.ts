import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { LoadingCompletedEvent } from '../../transaksi/produk-out/events/loading-completed.event';
import { NOTIF_TYPE, ENTITY_TYPE } from '../../common/constants/notification.constant';

@Injectable()
export class LoadingNotificationListener {
  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent('loading.completed')
  async handleLoadingCompleted(event: LoadingCompletedEvent) {
    await this.notifications.createAndSend({
      user_id: event.salesUserId,
      actor_id: event.actorId,
      type: NOTIF_TYPE.LOADING_COMPLETED,
      title: "Loading Selesai",
      message: `Loading untuk BON #${event.bonId} telah selesai. ${event.totalItems} jenis produk telah dikeluarkan dari gudang oleh ${event.actorName}.`,
      entity_type: ENTITY_TYPE.BON,
      entity_id: event.bonId,
    });
  }
}