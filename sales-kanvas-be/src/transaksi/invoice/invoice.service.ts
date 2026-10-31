import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateInvoiceDto } from "./dto/invoice.dto";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { AuditLogService } from "../../audit-log/audit-log.service";
import { EventEmitter2 } from "@nestjs/event-emitter"; // ✅ Import EventEmitter
import { InvoiceCreatedEvent } from "./events/invoice-created.event"; // ✅ Import Event
import { InvoiceCancelledEvent } from "./events/invoice-cancelled.event"; // ✅ Import Event

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private eventEmitter: EventEmitter2, // ✅ Tambah EventEmitter
  ) {}

  async create(data: CreateInvoiceDto, user: AuthenticatedUser) {
    // 💡 Simpan transaksi dalam variabel agar bisa diakses setelah commit
    const invoice = await this.prisma.$transaction(
      async (tx) => {
        const outlet = await tx.outlet.findUnique({
          where: { id: data.outlet_id },
        });
        if (!outlet || outlet.is_deleted) {
          throw new NotFoundException(
            "Outlet ID tidak ditemukan atau sudah tidak aktif",
          );
        }
        const plan = await tx.salesKanvasPlan.findUnique({
          where: { id: data.sales_kanvas_plan_id },
        });
        if (!plan)
          throw new NotFoundException(
            "Rencana Kanvas (Plan ID) tidak ditemukan",
          );

        let total_tagihan = 0;
        const detailRows: Array<{
          produk_id: number;
          batch_id: number;
          qty: number;
          harga_satuan: number;
          subtotal: number;
        }> = [];

        for (const item of data.details) {
          const product = await tx.product.findUnique({
            where: { id: item.produk_id },
          });
          if (!product)
            throw new NotFoundException(
              `Produk ID ${item.produk_id} tidak ditemukan`,
            );
          if (!product.is_active) {
            throw new BadRequestException(
              `Produk ${product.name} sedang tidak aktif dan tidak dapat dijual.`,
            );
          }

          const produkHarga = await tx.produkHarga.findFirst({
            where: {
              produk_id: item.produk_id,
              tipe_harga_id: outlet.tipe_harga_id,
            },
          });
          if (!produkHarga) {
            throw new BadRequestException(
              `Harga untuk Produk ID ${item.produk_id} belum diatur untuk tipe harga outlet ini.`,
            );
          }
          const hargaResmi = produkHarga.harga.toNumber();

          const onloadedDetails = await tx.detailProdukOut.findMany({
            where: {
              produkOut: {
                kasbonProduk: { sales_kanvas_plan_id: plan.id },
                is_deleted: false,
              },
              produk_id: item.produk_id,
            },
            include: { batch: true },
          });

          const invoicedDetails = await tx.detailInvoiceOutlet.findMany({
            where: {
              invoiceOutlet: {
                sales_kanvas_plan_id: plan.id,
                is_deleted: false,
              },
              produk_id: item.produk_id,
            },
          });

          const sisaPerBatch = new Map<number, number>();
          for (const out of onloadedDetails) {
            sisaPerBatch.set(
              out.batch_id,
              (sisaPerBatch.get(out.batch_id) || 0) + out.qty,
            );
          }
          for (const inv of invoicedDetails) {
            sisaPerBatch.set(
              inv.batch_id,
              (sisaPerBatch.get(inv.batch_id) || 0) - inv.qty,
            );
          }

          let totalSisaBawa = 0;
          for (const sisa of sisaPerBatch.values()) totalSisaBawa += sisa;

          if (item.qty > totalSisaBawa) {
            throw new BadRequestException(
              `Invoice melebihi barang yang dibawa (Onloading). Sisa barang di Sales untuk Produk ID ${item.produk_id}: ${totalSisaBawa}, diminta: ${item.qty}.`,
            );
          }

          const sortedBatches = Array.from(sisaPerBatch.entries())
            .filter(([_, sisa]) => sisa > 0)
            .map(([batchId, sisa]) => {
              const batchInfo = onloadedDetails.find(
                (o) => o.batch_id === batchId,
              )!.batch;
              return { batchId, sisa, expired_date: batchInfo.expired_date };
            })
            .sort(
              (a, b) => a.expired_date.getTime() - b.expired_date.getTime(),
            );

          let remainingQty = item.qty;
          for (const b of sortedBatches) {
            if (remainingQty <= 0) break;
            const take = Math.min(b.sisa, remainingQty);
            const subtotal = take * hargaResmi;

            total_tagihan += subtotal;
            detailRows.push({
              produk_id: item.produk_id,
              batch_id: b.batchId,
              qty: take,
              harga_satuan: hargaResmi,
              subtotal,
            });
            remainingQty -= take;
          }
        }

        const newInvoice = await tx.invoiceOutlet.create({
          data: {
            outlet_id: data.outlet_id,
            sales_kanvas_plan_id: data.sales_kanvas_plan_id,
            tipe_pembayaran: data.tipe_pembayaran,
            total_tagihan,
            tgl_invoice: new Date(data.tgl_invoice),
          },
        });

        for (const row of detailRows) {
          await tx.detailInvoiceOutlet.create({
            data: {
              invoice_outlet_id: newInvoice.id,
              produk_id: row.produk_id,
              batch_id: row.batch_id,
              qty: row.qty,
              harga_satuan: row.harga_satuan,
              subtotal: row.subtotal,
            },
          });
        }

        if (data.tipe_pembayaran.toUpperCase() === "KREDIT") {
          await tx.kartuPiutangOutlet.create({
            data: {
              invoice_outlet_id: newInvoice.id,
              sisa_piutang: total_tagihan,
              jatuh_tempo: new Date(
                new Date().setDate(new Date().getDate() + 30),
              ),
            },
          });
        }

        await this.auditLog.log(
          {
            user_id: user.id,
            action: "CREATE_INVOICE",
            entity: "InvoiceOutlet",
            entity_id: newInvoice.id,
            new_values: {
              outlet_id: data.outlet_id,
              total_tagihan,
              tipe_pembayaran: data.tipe_pembayaran,
              items_count: detailRows.length,
            },
          },
          tx,
        );

        // Kembalikan data invoice dan nama outlet untuk digunakan di notifikasi
        return { invoice: newInvoice, outletName: outlet.nama_toko };
      },
      { isolationLevel: "Serializable" },
    );

    // 🚀 TRANSAKSI DB BERHASIL! Tembak Event Notifikasi di sini (di luar $transaction)
    const actor = await this.prisma.user.findUnique({ where: { id: user.id } });
    
    this.eventEmitter.emit(
      "invoice.created",
      new InvoiceCreatedEvent(
        invoice.invoice.id,
        invoice.outletName,
        invoice.invoice.total_tagihan.toNumber(),
        user.id,
        actor?.name || "Sales",
      ),
    );

    return invoice.invoice;
  }

    async findAll() {
    return this.prisma.invoiceOutlet.findMany({
      where: { is_deleted: false },
      include: {
        outlet: true,
        salesKanvasPlan: true,
        detailInvoiceOutlets: { include: { produk: true, batch: true } },
        kartuPiutangOutlet: true,
      },
      orderBy: { tgl_invoice: "desc" },
    });
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const invoice = await this.prisma.invoiceOutlet.findUnique({
      where: { id },
      include: {
        outlet: true,
        salesKanvasPlan: true,
        detailInvoiceOutlets: { include: { produk: true, batch: true } },
        kartuPiutangOutlet: true,
        pembayaranInvoices: true,
        invoiceReturProduks: { include: { detailInvoiceReturs: true } },
      },
    });
    
    if (!invoice) throw new NotFoundException("Invoice tidak ditemukan");

    const roleName = user.role.name.toLowerCase();
    const isGlobalRole = [
      "superadmin",
      "super admin",
      "kasir",
      "supervisor",
    ].includes(roleName);
    if (!isGlobalRole && roleName.includes("sales")) {
      if (invoice.salesKanvasPlan?.user_id !== user.id) {
        throw new NotFoundException("Invoice tidak ditemukan");
      }
    }
    return invoice;
  }

  async cancel(id: number, user: AuthenticatedUser) {
    const result = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoiceOutlet.findUnique({
        where: { id, is_deleted: false },
        include: { kartuPiutangOutlet: true, pembayaranInvoices: true },
      });

      if (!invoice) throw new NotFoundException('Invoice tidak ditemukan atau sudah batal');
      
      if (invoice.pembayaranInvoices.length > 0) {
        throw new BadRequestException('Invoice tidak bisa dibatalkan karena sudah ada pembayaran.');
      }

      await tx.invoiceOutlet.update({
        where: { id },
        data: { is_deleted: true },
      });

      if (invoice.kartuPiutangOutlet) {
        await tx.kartuPiutangOutlet.update({
          where: { invoice_outlet_id: id },
          data: { sisa_piutang: 0, is_deleted: true },
        });
      }

      await this.auditLog.log({
        user_id: user.id,
        action: 'CANCEL_INVOICE',
        entity: 'InvoiceOutlet',
        entity_id: id,
        old_values: { total_tagihan: invoice.total_tagihan },
      }, tx);

      return { success: true, message: 'Invoice berhasil dibatalkan' };
    }, { isolationLevel: 'Serializable' });

    const actor = await this.prisma.user.findUnique({ where: { id: user.id } });
    this.eventEmitter.emit(
      "invoice.cancelled",
      new InvoiceCancelledEvent(id, user.id, actor?.name || "User"),
    );

    return result;
  }
}