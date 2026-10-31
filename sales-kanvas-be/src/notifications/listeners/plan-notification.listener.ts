import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanApprovedEvent } from '../../plan/events/plan-approved.event';
import { PlanCreatedEvent } from '../../plan/events/plan-created.event';
import { NOTIF_TYPE, ENTITY_TYPE } from '../../common/constants/notification.constant';

@Injectable()
export class PlanNotificationListener {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('plan.created')
  async handlePlanCreated(event: PlanCreatedEvent) {    const recipients = await this.prisma.user.findMany({
      where: { 
        role: { name: { in: ["Supervisor Pemasaran", "Super Admin"] } }, 
        is_active: true 
      },
    });

    for (const recipient of recipients) {
      await this.notifications.createAndSend({
        user_id: recipient.id,
        actor_id: event.actorId,
        type: NOTIF_TYPE.PLAN_CREATED,
        title: "Plan Baru Dibuat",
        message: `Plan ${event.planInvoice} dibuat oleh ${event.actorName} dan menunggu persetujuan.`,
        entity_type: ENTITY_TYPE.PLAN,
        entity_id: event.planId,
      });
    }
  }

  @OnEvent('plan.approved')
  async handlePlanApproved(event: PlanApprovedEvent) {
    await this.notifications.createAndSend({
      user_id: event.salesUserId,
      actor_id: event.actorId,
      type: NOTIF_TYPE.PLAN_APPROVED,
      title: "Plan Disetujui",
      message: `Plan ${event.planInvoice} milik Anda telah disetujui oleh ${event.actorName}.`,
      entity_type: ENTITY_TYPE.PLAN,
      entity_id: event.planId,
    });
  }
}