import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(
    data: {
      user_id: number;
      action: string;      
      entity: string;      
      entity_id: string | number;
      old_values?: any;
      new_values?: any;
    },
    tx?: Prisma.TransactionClient 
  ) {
    const client = tx || this.prisma;
    try {
      await client.auditLog.create({
        data: {
          user_id: data.user_id,
          action: data.action,
          entity: data.entity,
          entity_id: String(data.entity_id),
          old_values: data.old_values ? JSON.parse(JSON.stringify(data.old_values)) : undefined,
          new_values: data.new_values ? JSON.parse(JSON.stringify(data.new_values)) : undefined,
        },
      });
    } catch (error) {
      console.error('[AUDIT LOG ERROR]', error);
    }
  }
}