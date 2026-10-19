import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePlanDto,
  FindAllPlanDto,
  PLAN_STATUS,
  UpdatePlanDto,
  UpdateStatusPlanDto,
} from './plan.dto';

const PLAN_INCLUDE = {
  vehicle: true,
  marketArea: true,
  salesKanvasPersonil: { include: { employee: true } },
  salesKanvasPlanDetail: { include: { product: true } },
  salesKanvasKasbonMaterial: { include: { kasbonMaterialType: true } },
} satisfies Prisma.SalesKanvasPlanInclude;

type Children = {
  details: { product_id: number; qty: number }[];
  personils: { employee_id: number; position: string }[];
  kasbon: { kasbon_material_type_id: number; price: number; qty: number }[];
};

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  // Format sama dengan InvoiceService be-my-mubarok: SKS-YYYYMMDD-0001.
  // ponytail: count+1 bisa bentrok bila 2 request di hari yang sama
  // bersamaan; pakai sequence/advisory lock bila volume naik.
  private async generateInvoice(tx: Prisma.TransactionClient, date: Date) {
    const iso = date.toISOString().slice(0, 10);
    const count = await tx.salesKanvasPlan.count({
      where: {
        tgl_invoice: {
          gte: new Date(iso + 'T00:00:00.000Z'),
          lt: new Date(iso + 'T23:59:59.999Z'),
        },
      },
    });
    return `SKS-${iso.replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
  }

  create(dto: CreatePlanDto, userId: number, ip: string) {
    return this.prisma.$transaction(async (tx) => {
      const {
        salesKanvasPlanPersonil,
        salesKanvasPlanDetail,
        salesKanvasKasbonMaterial,
        tgl_invoice,
        tgl_pergi_kanvas,
        tgl_kembali_kanvas,
        ...header
      } = dto;

      const plan = await tx.salesKanvasPlan.create({
        data: {
          ...header,
          status: PLAN_STATUS.DRAFT,
          invoice: await this.generateInvoice(tx, new Date(tgl_invoice)),
          tgl_invoice: new Date(tgl_invoice),
          tgl_pergi_kanvas: new Date(tgl_pergi_kanvas),
          tgl_kembali_kanvas: tgl_kembali_kanvas
            ? new Date(tgl_kembali_kanvas)
            : null,
          user_id: userId,
          ip,
        },
      });

      await this.createChildren(tx, plan.id, userId, ip, {
        details: salesKanvasPlanDetail,
        personils: salesKanvasPlanPersonil,
        kasbon: salesKanvasKasbonMaterial ?? [],
      });

      return tx.salesKanvasPlan.findUniqueOrThrow({
        where: { id: plan.id },
        include: PLAN_INCLUDE,
      });
    });
  }

  async findAll(query: FindAllPlanDto) {
    const {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      status,
      tanggalPergiKanvasStart,
      tanggalPergiKanvasEnd,
      market_area_id,
    } = query;

    const where: Prisma.SalesKanvasPlanWhereInput = {};
    if (search) where.invoice = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (market_area_id) where.market_area_id = market_area_id;
    if (tanggalPergiKanvasStart || tanggalPergiKanvasEnd) {
      where.tgl_pergi_kanvas = {
        ...(tanggalPergiKanvasStart && {
          gte: new Date(tanggalPergiKanvasStart),
        }),
        ...(tanggalPergiKanvasEnd && { lte: new Date(tanggalPergiKanvasEnd) }),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.salesKanvasPlan.findMany({
        where,
        include: PLAN_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.salesKanvasPlan.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  findOne(id: number) {
    // findUniqueOrThrow → P2025 → 404 via PrismaExceptionFilter.
    return this.prisma.salesKanvasPlan.findUniqueOrThrow({
      where: { id },
      include: PLAN_INCLUDE,
    });
  }

  // REVISI: plan lama dibatalkan, dibuat plan baru (revision+1) dengan id baru.
  revise(id: number, dto: UpdatePlanDto, userId: number, ip: string) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.salesKanvasPlan.findUniqueOrThrow({
        where: { id },
        include: {
          salesKanvasPlanDetail: true,
          salesKanvasPersonil: true,
          salesKanvasKasbonMaterial: true,
        },
      });

      if (old.status === PLAN_STATUS.BATAL) {
        throw new BadRequestException(
          'Tidak dapat merevisi plan yang sudah dibatalkan',
        );
      }

      const tglInvoice = dto.tgl_invoice
        ? new Date(dto.tgl_invoice)
        : old.tgl_invoice;
      const invoice = await this.generateInvoice(tx, tglInvoice);

      await tx.salesKanvasPlan.update({
        where: { id },
        data: {
          cancelled_at: new Date(),
          revisi_to: invoice,
          status: PLAN_STATUS.BATAL,
          updated_at: new Date(),
        },
      });

      const plan = await tx.salesKanvasPlan.create({
        data: {
          invoice,
          tgl_invoice: tglInvoice,
          tgl_pergi_kanvas: dto.tgl_pergi_kanvas
            ? new Date(dto.tgl_pergi_kanvas)
            : old.tgl_pergi_kanvas,
          tgl_kembali_kanvas:
            dto.tgl_kembali_kanvas === undefined
              ? old.tgl_kembali_kanvas
              : dto.tgl_kembali_kanvas
                ? new Date(dto.tgl_kembali_kanvas)
                : null,
          market_area_id: dto.market_area_id ?? old.market_area_id,
          vehicle_id: dto.vehicle_id ?? old.vehicle_id,
          status: old.status, // plan baru mewarisi status lama
          note: dto.note === undefined ? old.note : dto.note,
          revision: old.revision + 1,
          user_id: userId,
          ip,
        },
      });

      await this.createChildren(tx, plan.id, userId, ip, {
        details:
          dto.salesKanvasPlanDetail ??
          old.salesKanvasPlanDetail.map((d) => ({
            product_id: d.product_id,
            qty: d.qty,
          })),
        personils:
          dto.salesKanvasPlanPersonil ??
          old.salesKanvasPersonil.map((p) => ({
            employee_id: p.employee_id,
            position: p.position,
          })),
        kasbon:
          dto.salesKanvasKasbonMaterial ??
          old.salesKanvasKasbonMaterial.map((k) => ({
            kasbon_material_type_id: k.kasbon_material_type_id,
            price: Number(k.price),
            qty: k.qty,
          })),
      });

      return tx.salesKanvasPlan.findUniqueOrThrow({
        where: { id: plan.id },
        include: PLAN_INCLUDE,
      });
    });
  }

  updateStatus(
    id: number,
    dto: UpdateStatusPlanDto,
    userId: number,
    ip: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.salesKanvasPlan.findUniqueOrThrow({
        where: { id },
      });

      if (plan.status === PLAN_STATUS.BATAL) {
        throw new BadRequestException(
          'Tidak dapat mengubah status plan yang sudah dibatalkan',
        );
      }

      return tx.salesKanvasPlan.update({
        where: { id },
        data: {
          status: dto.status,
          user_id: userId,
          ip,
          updated_at: new Date(),
        },
      });
    });
  }

  private async createChildren(
    tx: Prisma.TransactionClient,
    planId: number,
    userId: number,
    ip: string,
    c: Children,
  ) {
    const audit = { sales_kanvas_plan_id: planId, user_id: userId, ip };
    if (c.details.length) {
      await tx.salesKanvasPlanDetail.createMany({
        data: c.details.map((d) => ({ ...d, sales_kanvas_plan_id: planId })),
      });
    }
    if (c.personils.length) {
      await tx.salesKanvasPersonil.createMany({
        data: c.personils.map((p) => ({ ...p, ...audit })),
      });
    }
    if (c.kasbon.length) {
      await tx.salesKanvasKasbonMaterial.createMany({
        data: c.kasbon.map((k) => ({ ...k, ...audit })),
      });
    }
  }
}
