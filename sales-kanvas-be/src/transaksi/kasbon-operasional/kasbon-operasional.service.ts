import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKasbonOperasionalDto } from './dto/kasbon-operasional.dto';
import { AuditLogService } from '../../audit-log/audit-log.service'; 

@Injectable()
export class KasbonOperasionalService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async create(data: CreateKasbonOperasionalDto, userId: number, ip: string) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.salesKanvasPlan.findUnique({ where: { id: data.sales_kanvas_plan_id } });
      if (!plan) throw new NotFoundException('Rencana Kanvas (Plan ID) tidak ditemukan');

      const kasbon = await tx.kasbonOperasional.create({
        data: {
          sales_kanvas_plan_id: data.sales_kanvas_plan_id,
          nominal_kasbon: data.nominal_kasbon,
          status: 'Pending',
          user_id: userId,
          ip: ip,
        },
      });

      for (const item of data.details) {
        await tx.detailKasbonOperasional.create({
          data: {
            kasbon_operasional_id: kasbon.id,
            nama_pengeluaran: item.nama_pengeluaran,
            nominal: item.nominal,
            foto_bukti: item.foto_bukti,
          },
        });
      }

      await this.auditLog.log({
        user_id: userId,
        action: 'CREATE_KASBON_OPERASIONAL',
        entity: 'KasbonOperasional',
        entity_id: kasbon.id,
        new_values: { nominal: data.nominal_kasbon, plan_id: data.sales_kanvas_plan_id },
      }, tx);

      return kasbon;
    });
  }

  async findAll() {
    return this.prisma.kasbonOperasional.findMany({
      where: { is_deleted: false },
      include: {
        salesKanvasPlan: true,
        detailKasbonOperasional: true,
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async updateStatus(id: number, status: string, userId: number, ip: string) {
    const kasbon = await this.prisma.kasbonOperasional.findUnique({
      where: { id },
    });

    if (!kasbon || kasbon.is_deleted) {
      throw new NotFoundException('Kasbon Operasional tidak ditemukan');
    }

    const allowedStatuses = ['APPROVED', 'REJECTED'];
    if (!allowedStatuses.includes(status.toUpperCase())) {
      throw new BadRequestException('Status tidak valid. Gunakan APPROVED atau REJECTED');
    }

    const updated = await this.prisma.kasbonOperasional.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        user_id: userId, 
        ip: ip,
      },
    });

    await this.auditLog.log({
      user_id: userId,
      action: 'UPDATE_KASBON_STATUS',
      entity: 'KasbonOperasional',
      entity_id: kasbon.id,
      old_values: { status: kasbon.status },
      new_values: { status: updated.status },
    });

    return updated;
  }
}