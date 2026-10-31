import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async createAndSend(data: {
    user_id: number;
    actor_id?: number;
    type: string;
    title: string;
    message: string;
    entity_type: string;
    entity_id: number;
  }) {
    const notif = await this.prisma.notification.create({ data });

    this.gateway.server.to(`user:${data.user_id}`).emit('new_notification', notif);

    return notif;
  }

  async findAll(userId: number) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, user_id: userId }, 
      data: { is_read: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }
}