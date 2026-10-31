import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException, 
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReturDto } from "./dto/retur.dto";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ReturnSubmittedEvent } from "./events/return-submitted.event";
import { ReturnApprovedEvent } from "./events/return-approved.event";

@Injectable()
export class ReturService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(data: CreateReturDto, user: AuthenticatedUser) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        let salesUserId: number | null = null;
        let outletName = "Outlet";

        if (data.invoice_outlet_id) {
          const invoice = await tx.invoiceOutlet.findUnique({
            where: { id: data.invoice_outlet_id, is_deleted: false },
            include: { outlet: true, salesKanvasPlan: true },
          });
          if (!invoice)
            throw new NotFoundException(
              "Invoice tidak ditemukan atau sudah dibatalkan",
            );

          salesUserId = invoice.salesKanvasPlan?.user_id || null;
          outletName = invoice.outlet?.nama_toko || "Outlet";

          const roleName = user.role.name.toLowerCase();
          const isGlobalRole = [
            "superadmin",
            "super admin",
            "kasir",
            "supervisor",
          ].includes(roleName);
          if (!isGlobalRole && roleName.includes("sales")) {
            if (invoice.salesKanvasPlan?.user_id !== user.id)
              throw new NotFoundException("Invoice tidak ditemukan");
          }
        }

        const retur = await tx.invoiceReturProduk.create({
          data: {
            outlet_id: data.outlet_id,
            invoice_outlet_id: data.invoice_outlet_id || null,
            gudang_retur_id: data.gudang_retur_id,
            total_nilai_retur: data.total_nilai_retur,
            status: "DRAFT",
          },
        });

        for (const item of data.details) {
          if (data.invoice_outlet_id) {
            const totalPurchasedAgg = await tx.detailInvoiceOutlet.aggregate({
              where: {
                invoice_outlet_id: data.invoice_outlet_id,
                produk_id: item.produk_id,
              },
              _sum: { qty: true },
            });
            const totalPurchased = totalPurchasedAgg._sum.qty || 0;
            if (totalPurchased === 0)
              throw new BadRequestException(
                `Produk ID ${item.produk_id} tidak ada di dalam Invoice ini.`,
              );

            const totalReturnedAgg =
              await tx.detailInvoiceReturProduk.aggregate({
                where: {
                  invoiceReturProduk: {
                    invoice_outlet_id: data.invoice_outlet_id,
                    is_deleted: false,
                    status: "APPROVED",
                  },
                  produk_id: item.produk_id,
                },
                _sum: { qty: true },
              });
            const totalReturned = totalReturnedAgg._sum.qty || 0;
            if (totalReturned + item.qty > totalPurchased) {
              throw new BadRequestException(
                `Qty retur melebihi pembelian. Sisa yang bisa diretur: ${totalPurchased - totalReturned}`,
              );
            }
          }

          await tx.detailInvoiceReturProduk.create({
            data: {
              invoice_retur_produk_id: retur.id,
              produk_id: item.produk_id,
              batch_id: item.batch_id,
              qty: item.qty,
              alasan_retur: item.alasan_retur,
            },
          });
        }

        return { retur, salesUserId, outletName };
      },
      { isolationLevel: "Serializable" },
    );

    if (result.salesUserId) {
      const actor = await this.prisma.user.findUnique({
        where: { id: user.id },
      });
      this.eventEmitter.emit(
        "return.submitted",
        new ReturnSubmittedEvent(
          result.retur.id,
          result.salesUserId,
          result.outletName,
          user.id,
          actor?.name || "Sales",
        ),
      );
    }

    return result.retur;
  }

  async approve(id: number, user: AuthenticatedUser) {
    const roleName = user.role.name;
    const allowedRoles = ["Super Admin", "Supervisor Pemasaran", "superadmin"];
    if (!allowedRoles.includes(roleName)) {
      throw new ForbiddenException(
        "Hanya Supervisor Pemasaran yang dapat menyetujui Retur.",
      );
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const retur = await tx.invoiceReturProduk.findUnique({
          where: { id },
          include: {
            detailInvoiceReturs: true,
            invoiceOutlet: { include: { salesKanvasPlan: true } },
          },
        });

        if (!retur) throw new NotFoundException("Retur tidak ditemukan");
        if (retur.status === "APPROVED")
          throw new BadRequestException("Retur sudah disetujui");
        if (retur.status !== "DRAFT")
          throw new BadRequestException(
            "Hanya status DRAFT yang bisa di-approve",
          );

        await tx.invoiceReturProduk.update({
          where: { id },
          data: { status: "APPROVED" },
        });

        if (retur.invoice_outlet_id) {
          const piutang = await tx.kartuPiutangOutlet.findUnique({
            where: { invoice_outlet_id: retur.invoice_outlet_id },
          });

          if (piutang && Number(piutang.sisa_piutang) > 0) {
            const sisaPiutang = Number(piutang.sisa_piutang);
            const nilaiRetur = Number(retur.total_nilai_retur);

            const nominalPotongan = Math.min(sisaPiutang, nilaiRetur);

            await tx.alokasiReturPiutang.create({
              data: {
                invoice_retur_produk_id: retur.id,
                kartu_piutang_outlet_id: piutang.id,
                nominal_potongan: nominalPotongan,
              },
            });

            await tx.kartuPiutangOutlet.update({
              where: { id: piutang.id },
              data: { sisa_piutang: { decrement: nominalPotongan } },
            });
          }
        }

        return {
          retur,
          salesUserId: retur.invoiceOutlet?.salesKanvasPlan?.user_id,
        };
      },
      { isolationLevel: "Serializable" },
    );

    if (result.salesUserId) {
      const actor = await this.prisma.user.findUnique({
        where: { id: user.id },
      });
      this.eventEmitter.emit(
        "return.approved",
        new ReturnApprovedEvent(
          id,
          result.salesUserId,
          user.id,
          actor?.name || "SPV",
        ),
      );
    }

    return { success: true, message: "Retur disetujui dan piutang dipotong" };
  }

  async findAll() {
    return this.prisma.invoiceReturProduk.findMany({
      where: { is_deleted: false },
      include: {
        outlet: true,
        gudangRetur: true,
        detailInvoiceReturs: { include: { produk: true, batch: true } },
        alokasiReturPiutangs: true,
      },
    });
  }
}
