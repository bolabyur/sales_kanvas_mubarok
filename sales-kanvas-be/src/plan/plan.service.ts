import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreatePlanDto,
  UpdatePlanDto,
  UpdateStatusPlanDto,
  FindAllPlanDto,
  PLAN_STATUS,
} from "./dto/plan.dto";
import { AuditLogService } from "../audit-log/audit-log.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PlanApprovedEvent } from "./events/plan-approved.event";
import { PlanCreatedEvent } from "./events/plan-created.event"; // ✅
import { AuthenticatedUser } from "src/common/interfaces/authenticated-user.interface";

@Injectable()
export class PlanService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(data: CreatePlanDto, userId: number, ip: string) {
    const market = await this.prisma.marketArea.findUnique({
      where: { id: data.market_area_id },
    });
    if (!market) throw new BadRequestException("Market Area ID tidak ditemukan");

    const vehicle = await this.prisma.vehicele.findUnique({
      where: { id: data.vehicle_id },
    });
    if (!vehicle) throw new BadRequestException("Kendaraan ID tidak ditemukan");

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const uniqueSuffix = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    const invoice = `SKS-${dateStr}-${uniqueSuffix}`;

    const personils = data.salesKanvasPersonil.map((p) => ({ ...p, user_id: userId, ip }));
    const materials = data.salesKanvasKasbonMaterial?.map((m) => ({ ...m, user_id: userId, ip }));

    const plan = await this.prisma.salesKanvasPlan.create({
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
        salesKanvasPersonil: { create: personils },
        salesKanvasPlanDetail: { create: data.salesKanvasPlanDetail },
        salesKanvasKasbonMaterial: materials ? { create: materials } : undefined,
      },
      include: {
        salesKanvasPersonil: { include: { employee: true } },
        salesKanvasPlanDetail: { include: { product: true } },
      },
    });

    await this.auditLog.log({
      user_id: userId,
      action: "CREATE_PLAN",
      entity: "SalesKanvasPlan",
      entity_id: String(plan.id),
      new_values: { invoice: plan.invoice, status: plan.status },
    });

    // 🚀 TEMBAK EVENT PLAN CREATED
    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    this.eventEmitter.emit(
      "plan.created",
      new PlanCreatedEvent(plan.id, plan.invoice, userId, actor?.name || "Sales")
    );

    return plan;
  }

  async findAll(query: FindAllPlanDto, user: AuthenticatedUser) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 50); 
    const skip = (page - 1) * limit;

    const where: Prisma.SalesKanvasPlanWhereInput = {};
    const roleName = user?.role?.name?.toLowerCase() || "";
    const isGlobalRole = ["superadmin", "super admin", "supervisor pemasaran"].includes(roleName);

    if (!isGlobalRole) {
      where.user_id = Number(user.id); 
    }

    if (query.search) where.invoice = { contains: query.search, mode: "insensitive" };
    if (query.status) where.status = query.status;
    if (query.market_area_id) where.market_area_id = Number(query.market_area_id);
    if (query.tanggalPergiKanvasStart && query.tanggalPergiKanvasEnd) {
      where.tgl_pergi_kanvas = { gte: new Date(query.tanggalPergiKanvasStart), lte: new Date(query.tanggalPergiKanvasEnd) };
    }

    const [items, total] = await Promise.all([
      this.prisma.salesKanvasPlan.findMany({
        where, skip, take: limit,
        orderBy: { [query.sortBy || "created_at"]: query.sortOrder || "desc" },
        include: {
          vehicle: true, marketArea: true,
          salesKanvasPersonil: { include: { employee: true } },
          salesKanvasPlanDetail: { include: { product: true } },
          salesKanvasKasbonMaterial: true,
          invoiceOutlets: { where: { is_deleted: false }, select: { id: true } },
          kasbonProduks: { where: { is_deleted: false }, select: { id: true } }  
        },
      }),
      this.prisma.salesKanvasPlan.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const plan = await this.prisma.salesKanvasPlan.findUnique({
      where: { id },
      include: {
        vehicle: true, marketArea: true,
        salesKanvasPersonil: { include: { employee: true } },
        salesKanvasPlanDetail: { include: { product: true } },
        invoiceOutlets: { include: { outlet: true, detailInvoiceOutlets: true, kartuPiutangOutlet: true } },
        kasbonProduks: { include: { detailKasbonProduks: { include: { produk: true } }, produkOuts: { include: { detailProdukOuts: true } } } },
        kasbonOperasionals: true,
        settlements: true,
        kanvasReturns: { include: { details: true } },
      },
    });
    if (!plan) throw new NotFoundException("Plan tidak ditemukan");

    const approvalLog = await this.prisma.auditLog.findFirst({
      where: { entity: "SalesKanvasPlan", entity_id: String(id), action: "APPROVE_PLAN" },
      orderBy: { created_at: "desc" },
    });

    return { ...plan, approvalLog };
  }

  async update(id: number, data: UpdatePlanDto, userId: number, ip: string) {
    const plan = await this.findOne(id);

    if (plan.status === PLAN_STATUS.BATAL) throw new BadRequestException("Plan yang sudah dibatalkan tidak dapat diubah.");
    if (plan.status === PLAN_STATUS.DISETUJUI) throw new BadRequestException("Plan yang sudah disetujui (ACC) tidak dapat direvisi.");

    const updateData: Prisma.SalesKanvasPlanUncheckedUpdateInput = { ip: ip };
    if (data.tgl_invoice) updateData.tgl_invoice = new Date(data.tgl_invoice);
    if (data.tgl_pergi_kanvas) updateData.tgl_pergi_kanvas = new Date(data.tgl_pergi_kanvas);
    if (data.tgl_kembali_kanvas) updateData.tgl_kembali_kanvas = new Date(data.tgl_kembali_kanvas);
    if (data.market_area_id) updateData.market_area_id = data.market_area_id;
    if (data.vehicle_id) updateData.vehicle_id = data.vehicle_id;
    if (data.note) updateData.note = data.note;

    const updatedPlan = await this.prisma.salesKanvasPlan.update({ where: { id }, data: updateData });

    await this.auditLog.log({
      user_id: userId,
      action: "UPDATE_PLAN",
      entity: "SalesKanvasPlan",
      entity_id: String(id),
      old_values: { note: plan.note },
      new_values: { note: updatedPlan.note },
    });

    return updatedPlan;
  }

  async updateStatus(id: number, data: UpdateStatusPlanDto, userId: number, ip: string) {
    const plan = await this.findOne(id);

    if (plan.status === PLAN_STATUS.BATAL) throw new BadRequestException("Plan sudah dibatalkan.");
    if (plan.status === PLAN_STATUS.KOMPLIT) throw new BadRequestException("Plan sudah selesai.");

    if (data.status === PLAN_STATUS.DISETUJUI) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
      const allowedRoles = ["Super Admin", "Supervisor Pemasaran"];
      if (!user || !allowedRoles.includes(user.role.name)) {
        throw new ForbiddenException("Hanya Supervisor Pemasaran yang dapat menyetujui (ACC) Plan ini.");
      }
    }

    if (data.status === PLAN_STATUS.BATAL) {
      const result = await this.prisma.$transaction(async (tx) => {
        const produkOutAktif = await tx.produkOut.count({ where: { is_deleted: false, kasbonProduk: { sales_kanvas_plan_id: id } } });
        if (produkOutAktif > 0) throw new BadRequestException("Barang sudah dikeluarkan. Batalkan ProdukOut terlebih dahulu.");

        await tx.kasbonProduk.updateMany({
          where: { sales_kanvas_plan_id: id, status: { in: ["PENDING", "DRAFT"] }, is_deleted: false },
          data: { status: "BATAL" },
        });

        return tx.salesKanvasPlan.update({
          where: { id },
          data: { status: PLAN_STATUS.BATAL, cancelled_at: new Date(), user_id: userId, ip },
        });
      }, { isolationLevel: "Serializable" });

      await this.auditLog.log({
        user_id: userId, action: "CANCEL_PLAN", entity: "SalesKanvasPlan", entity_id: String(id),
        old_values: { status: plan.status }, new_values: { status: PLAN_STATUS.BATAL },
      });

      return result;
    }

    const updatedPlan = await this.prisma.salesKanvasPlan.update({ where: { id }, data: { status: data.status, ip } });

    await this.auditLog.log({
      user_id: userId, action: data.status === PLAN_STATUS.DISETUJUI ? "APPROVE_PLAN" : "UPDATE_STATUS_PLAN",
      entity: "SalesKanvasPlan", entity_id: String(id), old_values: { status: plan.status }, new_values: { status: updatedPlan.status },
    });

    if (data.status === PLAN_STATUS.DISETUJUI) {
      const approver = await this.prisma.user.findUnique({ where: { id: userId } });
      this.eventEmitter.emit(
        "plan.approved",
        new PlanApprovedEvent(plan.id, plan.invoice, plan.user_id, userId, approver?.name || "Atasan")
      );
    }

    return updatedPlan;
  }
}