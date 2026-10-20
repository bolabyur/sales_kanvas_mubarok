import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanOutletDto } from './dto/plan-outlet.dto';

@Injectable()
export class PlanOutletService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePlanOutletDto) {
    const plan = await this.prisma.salesKanvasPlan.findUnique({ where: { id: data.sales_kanvas_plan_id } });
    if (!plan) throw new BadRequestException('Plan ID tidak ditemukan');

    const outlet = await this.prisma.outlet.findUnique({ where: { id: data.outlet_id } });
    if (!outlet) throw new BadRequestException('Outlet ID tidak ditemukan');

    return this.prisma.salesKanvasPlanOutlet.create({ data });
  }

  async findByPlan(planId: number) {
    return this.prisma.salesKanvasPlanOutlet.findMany({
      where: { sales_kanvas_plan_id: planId, is_deleted: false },
      include: { outlet: true },
      orderBy: { urutan_kunjungan: 'asc' },
    });
  }
}