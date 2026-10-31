import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateKasbonProdukDto } from "./dto/kasbon-produk.dto";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { BonCreatedEvent } from "./events/bon-created.event";

@Injectable()
export class KasbonProdukService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(data: CreateKasbonProdukDto, userId: number, ip: string) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const plan = await tx.salesKanvasPlan.findUnique({
          where: { id: data.sales_kanvas_plan_id },
        });
        if (!plan) throw new NotFoundException("Rencana Kanvas tidak ditemukan");
        if (plan.status !== "DISETUJUI") {
          throw new BadRequestException(
            "BON hanya bisa dibuat jika Rencana Kanvas sudah disetujui.",
          );
        }

        const existingKasbon = await tx.kasbonProduk.findFirst({
          where: { sales_kanvas_plan_id: data.sales_kanvas_plan_id, is_deleted: false },
        });
        if (existingKasbon) {
          throw new BadRequestException(
            "Kasbon untuk Plan ini sudah dibuat. Tidak boleh membuat dua kali.",
          );
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        for (const item of data.details) {
          const agg = await tx.batch.aggregate({
            where: {
              produk_id: item.produk_id,
              is_deleted: false,
              expired_date: { gte: startOfToday },
            },
            _sum: { stok_gudang: true },
          });
          const stok = agg._sum.stok_gudang ?? 0;
          if (stok < item.qty_bawa) {
            throw new BadRequestException(
              `Stok total produk ID ${item.produk_id} tidak cukup. Tersedia: ${stok}, diminta: ${item.qty_bawa}.`,
            );
          }
        }

        const bonProduk = await tx.kasbonProduk.create({
          data: {
            sales_kanvas_plan_id: data.sales_kanvas_plan_id,
            status: "DRAFT",
            user_id: userId,
            ip,
          },
        });

        for (const item of data.details) {
          await tx.detailKasbonProduk.create({
            data: {
              kasbon_produk_id: bonProduk.id,
              produk_id: item.produk_id,
              qty_bawa: item.qty_bawa,
              batch_id: null,
            },
          });
        }

        if (data.operasional && data.operasional.length > 0) {
          const totalNominal = data.operasional.reduce((sum, item) => sum + item.nominal, 0);
          const bonOperasional = await tx.kasbonOperasional.create({
            data: {
              sales_kanvas_plan_id: data.sales_kanvas_plan_id,
              nominal_kasbon: totalNominal,
              status: "DRAFT",
              user_id: userId,
              ip,
            },
          });

          for (const op of data.operasional) {
            await tx.detailKasbonOperasional.create({
              data: {
                kasbon_operasional_id: bonOperasional.id,
                nama_pengeluaran: op.nama_pengeluaran,
                nominal: op.nominal,
                foto_bukti: op.foto_bukti,
              },
            });
          }
        }

        const finalBon = await tx.kasbonProduk.findUnique({
          where: { id: bonProduk.id },
          include: { detailKasbonProduks: true },
        });

        return { bon: finalBon, planInvoice: plan.invoice };
      },
      { isolationLevel: "Serializable" },
    );

    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    this.eventEmitter.emit(
      "bon.created",
      new BonCreatedEvent(
        result.bon!.id,
        result.planInvoice,
        userId,
        actor?.name || "Sales",
      ),
    );

    return result.bon;
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const bon = await this.prisma.kasbonProduk.findUnique({
      where: { id, is_deleted: false },
      include: {
        salesKanvasPlan: true,
        detailKasbonProduks: { include: { produk: true, batch: true } },
        produkOuts: {
          where: { is_deleted: false },
          include: { detailProdukOuts: { include: { batch: true } } },
        },
      },
    });
    if (!bon) throw new NotFoundException("BON tidak ditemukan");

    const roleName = user.role.name.toLowerCase();
    const isGlobalRole = ["superadmin", "super admin", "kasir", "supervisor"].includes(roleName);

    if (!isGlobalRole && roleName.includes("sales")) {
      if (bon.salesKanvasPlan?.user_id !== user.id) {
        throw new NotFoundException("BON tidak ditemukan");
      }
    }

    return bon;
  }

  async updateStatus(id: number, status: string, userId: number, ip: string) {
    const bon = await this.prisma.kasbonProduk.findUnique({ where: { id } });
    if (!bon) throw new NotFoundException("BON tidak ditemukan");

    if (status === "BATAL") {
      if (bon.status === "BATAL") {
        throw new BadRequestException("BON sudah dibatalkan.");
      }

      const produkOutAktif = await this.prisma.produkOut.count({
        where: { kasbon_produk_id: id, is_deleted: false },
      });
      if (produkOutAktif > 0) {
        throw new BadRequestException(
          "Barang sudah Onloading. SPV tidak dapat membatalkan langsung. " +
            "Hubungi Gudang untuk membatalkan Invoice Pengeluaran Barang (ProdukOut) terlebih dahulu.",
        );
      }

      return this.prisma.kasbonProduk.update({
        where: { id },
        data: { status: "BATAL" },
      });
    }

    if (bon.status === "BATAL") {
      throw new BadRequestException("BON sudah dibatalkan, status tidak bisa diubah.");
    }
    if (bon.status === "ONLOADING") {
      throw new BadRequestException(
        "BON sudah Onloading, status tidak bisa diubah manual. Gunakan endpoint ProdukOut Cancel.",
      );
    }

    return this.prisma.kasbonProduk.update({
      where: { id },
      data: { status },
    });
  }

  async findAll() {
    return this.prisma.kasbonProduk.findMany({
      where: { is_deleted: false },
      include: {
        salesKanvasPlan: {
          include: {
            salesKanvasPersonil: {
              include: { employee: true }
            }
          }
        },
        detailKasbonProduks: { include: { produk: true, batch: true } },
      },
      orderBy: { id: "desc" },
    });
  }
}