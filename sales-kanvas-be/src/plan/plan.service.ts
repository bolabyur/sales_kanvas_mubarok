import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreatePlanDto, 
  UpdatePlanDto, 
  UpdateStatusPlanDto, 
  FindAllPlanDto,
  PLAN_STATUS 
} from './dto/plan.dto';

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePlanDto, userId: number, ip: string) {
    const market = await this.prisma.marketArea.findUnique({ where: { id: data.market_area_id } });
    if (!market) throw new BadRequestException('Market Area ID tidak ditemukan');
    
    const vehicle = await this.prisma.vehicele.findUnique({ where: { id: data.vehicle_id } });
    if (!vehicle) throw new BadRequestException('Kendaraan ID tidak ditemukan');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.salesKanvasPlan.count();
    const invoice = `SKS-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    const personils = data.salesKanvasPersonil.map(p => ({
      ...p,
      user_id: userId,
      ip: ip,
    }));

    const materials = data.salesKanvasKasbonMaterial?.map(m => ({
      ...m,
      user_id: userId,
      ip: ip,
    }));

    return this.prisma.salesKanvasPlan.create({
      data: {
        invoice,
        tgl_invoice: new Date(data.tgl_invoice),
        tgl_pergi_kanvas: new Date(data.tgl_pergi_kanvas),
        tgl_kembali_kanvas: data.tgl_kembali_kanvas ? new Date(data.tgl_kembali_kanvas) : null,
        market_area_id: data.market_area_id,
        vehicle_id: data.vehicle_id,
        note: data.note,
        status: PLAN_STATUS.DRAFT,
        user_id: userId,
        ip: ip,
        salesKanvasPersonil: {
          create: personils, 
        },
        salesKanvasPlanDetail: {
          create: data.salesKanvasPlanDetail,
        },
        salesKanvasKasbonMaterial: materials ? {
          create: materials, 
        } : undefined,
      },
      include: {
        salesKanvasPersonil: { include: { employee: true } },
        salesKanvasPlanDetail: { include: { product: true } },
      },
    });
  }

  async findAll(query: FindAllPlanDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SalesKanvasPlanWhereInput = {}; 
    
    if (query.search) where.invoice = { contains: query.search, mode: 'insensitive' };
    if (query.status) where.status = query.status;
    if (query.market_area_id) where.market_area_id = Number(query.market_area_id);
    
    if (query.tanggalPergiKanvasStart && query.tanggalPergiKanvasEnd) {
      where.tgl_pergi_kanvas = {
        gte: new Date(query.tanggalPergiKanvasStart),
        lte: new Date(query.tanggalPergiKanvasEnd),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.salesKanvasPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'created_at']: query.sortOrder || 'desc' },
        include: { 
          vehicle: true, 
          marketArea: true,
          salesKanvasPersonil: { include: { employee: true } },
          salesKanvasPlanDetail: { include: { product: true } },
          salesKanvasKasbonMaterial: true,
        },
      }),
      this.prisma.salesKanvasPlan.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const plan = await this.prisma.salesKanvasPlan.findUnique({
      where: { id },
      include: { 
        vehicle: true, 
        marketArea: true,
        salesKanvasPersonil: { include: { employee: true } },
        salesKanvasPlanDetail: { include: { product: true } },
        
        invoiceOutlets: {
          include: {
            outlet: true,
            detailInvoiceOutlets: { include: { produk: true, batch: true } },
            kartuPiutangOutlet: true,
          }
        },
        kasbonProduks: {
          include: {
            detailKasbonProduks: { include: { produk: true } }
          }
        },
        kasbonOperasionals: true,
      },
    });
    if (!plan) throw new NotFoundException('Plan tidak ditemukan');
    return plan;
  }

  async update(id: number, data: UpdatePlanDto, userId: number, ip: string) {
    const plan = await this.findOne(id);
    
    if (plan.status === PLAN_STATUS.BATAL) {
      throw new BadRequestException('Plan yang sudah dibatalkan tidak dapat diubah.');
    }
    
    const updateData: Prisma.SalesKanvasPlanUncheckedUpdateInput = {
      user_id: userId,
      ip: ip,
    };

    if (data.tgl_invoice) updateData.tgl_invoice = new Date(data.tgl_invoice);
    if (data.tgl_pergi_kanvas) updateData.tgl_pergi_kanvas = new Date(data.tgl_pergi_kanvas);
    if (data.tgl_kembali_kanvas) updateData.tgl_kembali_kanvas = new Date(data.tgl_kembali_kanvas);
    if (data.market_area_id) updateData.market_area_id = data.market_area_id;
    if (data.vehicle_id) updateData.vehicle_id = data.vehicle_id;
    if (data.note) updateData.note = data.note;

    return this.prisma.salesKanvasPlan.update({
      where: { id },
      data: updateData, 
    });
  }

  async updateStatus(id: number, data: UpdateStatusPlanDto, userId: number, ip: string) {
    const plan = await this.findOne(id);
    
    if (plan.status === PLAN_STATUS.BATAL) {
      throw new BadRequestException('Plan sudah dibatalkan, status tidak bisa diubah lagi.');
    }
    if (plan.status === PLAN_STATUS.KOMPLIT) {
      throw new BadRequestException('Plan sudah selesai, status tidak bisa diubah lagi.');
    }

    return this.prisma.salesKanvasPlan.update({
      where: { id },
      data: { 
        status: data.status, 
        cancelled_at: data.status === PLAN_STATUS.BATAL ? new Date() : plan.cancelled_at,
        user_id: userId, 
        ip: ip 
      },
    });
  }
}