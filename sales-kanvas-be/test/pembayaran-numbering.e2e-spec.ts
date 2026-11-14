import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { AuditLogService } from "../src/audit-log/audit-log.service";

describe("TASK 08.0.5.2 - Pembayaran KW Numbering & Concurrency (e2e)", () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let token: string;
    let tokenSecondUser: string;
    let userId: number;
    let secondUserId: number | undefined;

    let invoiceId: number;
    let kartuPiutangId: number;
    let rollbackInvoiceId: number;
    let rollbackKartuId: number;

    const createdPembayaranIds: number[] = [];
    const createdTipeHargaIds: number[] = [];
    const createdOutletIds: number[] = [];
    const createdPlanIds: number[] = [];
    const createdAreaIds: number[] = [];
    const createdVehIds: number[] = [];
    // For Test 10 fresh invoices
    const extraInvoiceIds: number[] = [];
    const extraKartuIds: number[] = [];

    const runId = Date.now();

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api");
        await app.init();

        prisma = app.get(PrismaService);
        const jwtService = app.get(JwtService);

        // 1. Superadmin
        const user = await prisma.user.findUniqueOrThrow({
            where: { username: "superadmin" },
        });
        userId = user.id;
        token = jwtService.sign(
            { sub: userId, username: user.username },
            { secret: process.env.JWT_SECRET || "secret" },
        );

        // 2. Second user with pembayaran:write
        const secondUser = await prisma.user.findFirst({
            where: {
                id: { not: userId },
                role: {
                    permissionRoles: {
                        some: { permission: { name: "pembayaran:write" } },
                    },
                },
            },
        });
        if (secondUser) {
            secondUserId = secondUser.id;
            tokenSecondUser = jwtService.sign(
                { sub: secondUser.id, username: secondUser.username },
                { secret: process.env.JWT_SECRET || "secret" },
            );
        } else {
            console.warn("⚠️ Tidak ada user kedua dengan pembayaran:write.");
        }

        // 3. Fixtures
        const tipeHarga = await prisma.tipeHarga.create({
            data: { nama_tipe: `TH-${runId}` },
        });
        createdTipeHargaIds.push(tipeHarga.id);

        const outlet = await prisma.outlet.create({
            data: { nama_toko: `Toko-${runId}`, tipe_harga_id: tipeHarga.id },
        });
        createdOutletIds.push(outlet.id);

        const area = await prisma.marketArea.create({
            data: { name: `Area-${runId}`, user_id: userId, ip: "1" },
        });
        createdAreaIds.push(area.id);

        const veh = await prisma.vehicele.create({
            data: {
                name: `V-${runId}`, nopol: `K${runId}`,
                type_vehicle: "T", type_fuel: "S",
                user_id: userId, ip: "1",
            },
        });
        createdVehIds.push(veh.id);

        const plan = await prisma.salesKanvasPlan.create({
            data: {
                invoice: `INV-${runId}`,
                tgl_invoice: new Date(),
                tgl_pergi_kanvas: new Date(),
                market_area_id: area.id,
                vehicle_id: veh.id,
                status: "DISETUJUI",
                user_id: userId,
                ip: "1",
            },
        });
        createdPlanIds.push(plan.id);

        const invoice = await prisma.invoiceOutlet.create({
            data: {
                outlet_id: outlet.id,
                sales_kanvas_plan_id: plan.id,
                tipe_pembayaran: "Kredit",
                total_tagihan: 10000,
                tgl_invoice: new Date(),
                status: "DRAFT",
            },
        });
        invoiceId = invoice.id;

        const kartu = await prisma.kartuPiutangOutlet.create({
            data: { invoice_outlet_id: invoiceId, sisa_piutang: 10000 },
        });
        kartuPiutangId = kartu.id;

        const rollbackInvoice = await prisma.invoiceOutlet.create({
            data: {
                outlet_id: outlet.id,
                sales_kanvas_plan_id: plan.id,
                tipe_pembayaran: "Kredit",
                total_tagihan: 10000,
                tgl_invoice: new Date(),
                status: "DRAFT",
            },
        });
        rollbackInvoiceId = rollbackInvoice.id;

        const rollbackKartu = await prisma.kartuPiutangOutlet.create({
            data: { invoice_outlet_id: rollbackInvoiceId, sisa_piutang: 10000 },
        });
        rollbackKartuId = rollbackKartu.id;
    });

    afterAll(async () => {
        if (!app) return;

        const safePembayaranIds = createdPembayaranIds.filter((id) => id !== undefined);
        const safeKartuIds = [kartuPiutangId, rollbackKartuId, ...extraKartuIds].filter((id) => id !== undefined);
        const safeInvoiceIds = [invoiceId, rollbackInvoiceId, ...extraInvoiceIds].filter((id) => id !== undefined);
        const safePlanIds = createdPlanIds.filter((id) => id !== undefined);
        const safeOutletIds = createdOutletIds.filter((id) => id !== undefined);
        const safeTipeHargaIds = createdTipeHargaIds.filter((id) => id !== undefined);
        const safeAreaIds = createdAreaIds.filter((id) => id !== undefined);
        const safeVehIds = createdVehIds.filter((id) => id !== undefined);

        if (safePembayaranIds.length > 0)
            await prisma.pembayaranInvoice.deleteMany({ where: { id: { in: safePembayaranIds } } }).catch(() => {});
        if (safeKartuIds.length > 0)
            await prisma.kartuPiutangOutlet.deleteMany({ where: { id: { in: safeKartuIds } } }).catch(() => {});
        if (safeInvoiceIds.length > 0)
            await prisma.invoiceOutlet.deleteMany({ where: { id: { in: safeInvoiceIds } } }).catch(() => {});
        if (safePlanIds.length > 0)
            await prisma.salesKanvasPlan.deleteMany({ where: { id: { in: safePlanIds } } }).catch(() => {});
        if (safeOutletIds.length > 0)
            await prisma.outlet.deleteMany({ where: { id: { in: safeOutletIds } } }).catch(() => {});
        if (safeTipeHargaIds.length > 0)
            await prisma.tipeHarga.deleteMany({ where: { id: { in: safeTipeHargaIds } } }).catch(() => {});
        if (safeAreaIds.length > 0)
            await prisma.marketArea.deleteMany({ where: { id: { in: safeAreaIds } } }).catch(() => {});
        if (safeVehIds.length > 0)
            await prisma.vehicele.deleteMany({ where: { id: { in: safeVehIds } } }).catch(() => {});

        await app.close();
    });

    const reqPay = (
        invoiceIdToUse: number,
        nominal: number,
        key?: string,
        customPayload?: any,
        useSecondToken = false,
    ) => {
        const payload = customPayload || {
            invoice_outlet_id: invoiceIdToUse,
            nominal_bayar: nominal,
            tipe_bayar: "Tunai",
            tgl_bayar: new Date().toISOString(),
        };
        const req = request(app.getHttpServer())
            .post("/api/transaksi/pembayaran")
            .set("Authorization", `Bearer ${useSecondToken ? tokenSecondUser : token}`)
            .send(payload);
        if (key) req.set("x-idempotency-key", key);
        return req;
    };

    // Helper: create a fresh invoice for given owner
    const createFreshInvoice = async (ownerId: number, suffix: string) => {
        const tipeHargaId = createdTipeHargaIds[0];
        const outletId = createdOutletIds[0];

        const plan = await prisma.salesKanvasPlan.create({
            data: {
                invoice: `INV-KW-${runId}-${suffix}`,
                tgl_invoice: new Date(),
                tgl_pergi_kanvas: new Date(),
                market_area_id: createdAreaIds[0],
                vehicle_id: createdVehIds[0],
                status: "DISETUJUI",
                user_id: ownerId,
                ip: "1",
            },
        });
        createdPlanIds.push(plan.id);

        const invoice = await prisma.invoiceOutlet.create({
            data: {
                outlet_id: outletId,
                sales_kanvas_plan_id: plan.id,
                tipe_pembayaran: "Kredit",
                total_tagihan: 10000,
                tgl_invoice: new Date(),
                status: "DRAFT",
            },
        });
        extraInvoiceIds.push(invoice.id);

        const kartu = await prisma.kartuPiutangOutlet.create({
            data: { invoice_outlet_id: invoice.id, sisa_piutang: 10000 },
        });
        extraKartuIds.push(kartu.id);

        return invoice.id;
    };

    it("1 & 2. Sequential Numbering KW-YYMMDD-NNN", async () => {
        const res1 = await reqPay(invoiceId, 1000).expect(201);
        createdPembayaranIds.push(res1.body.data.id);
        expect(res1.body.data.document_number).toMatch(/^KW-\d{6}-\d{3}$/);

        const res2 = await reqPay(invoiceId, 1000).expect(201);
        createdPembayaranIds.push(res2.body.data.id);
        expect(res2.body.data.document_number).toMatch(/^KW-\d{6}-\d{3}$/);

        const doc1 = parseInt(res1.body.data.document_number.split("-")[2]);
        const doc2 = parseInt(res2.body.data.document_number.split("-")[2]);
        expect(doc2).toBe(doc1 + 1);
    });

    it("3. Concurrent Idempotency: 5 request paralel, key & payload sama", async () => {
        const key = `idem-conc-kw-${runId}`;
        const staticPayload = {
            invoice_outlet_id: invoiceId,
            nominal_bayar: 500,
            tipe_bayar: "Tunai",
            tgl_bayar: "2026-11-14T10:00:00.000Z",
        };

        const todayKey = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        const seqBefore = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "KW", date_key: todayKey } },
        });
        const lastNumBefore = seqBefore?.last_number || 0;

        const requests = Array(5).fill(null).map(() => reqPay(invoiceId, 500, key, staticPayload));
        const responses = await Promise.all(requests);

        responses.forEach((res) => expect(res.status).toBe(201));

        const ids = new Set(responses.map((r) => r.body.data.id));
        expect(ids.size).toBe(1);
        createdPembayaranIds.push(Array.from(ids)[0]);

        const docNumbers = new Set(responses.map((r) => r.body.data.document_number));
        expect(docNumbers.size).toBe(1);

        const count = await prisma.pembayaranInvoice.count({ where: { id: Array.from(ids)[0] } });
        expect(count).toBe(1);

        const seqAfter = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "KW", date_key: todayKey } },
        });
        expect(seqAfter?.last_number).toBe(lastNumBefore + 1);
    });

    it("4. Replay & Conflict Sequential", async () => {
        const key = `idem-seq-kw-${runId}`;
        const staticPayload = {
            invoice_outlet_id: invoiceId,
            nominal_bayar: 500,
            tipe_bayar: "Tunai",
            tgl_bayar: "2026-11-14T10:00:00.000Z",
        };

        const res1 = await reqPay(invoiceId, 500, key, staticPayload).expect(201);
        createdPembayaranIds.push(res1.body.data.id);

        const res2 = await reqPay(invoiceId, 500, key, staticPayload).expect(201);
        expect(res1.body.data.id).toBe(res2.body.data.id);

        const conflictPayload = { ...staticPayload, nominal_bayar: 999 };
        await reqPay(invoiceId, 999, key, conflictPayload).expect(409);
    });

    it("5. Pembayaran melebihi sisa piutang ditolak (400)", async () => {
        await reqPay(invoiceId, 8000).expect(400);
    });

    it("6. Concurrent Different Payments: Saldo piutang tetap konsisten", async () => {
        const requests = Array(3).fill(null).map(() => reqPay(invoiceId, 3000));
        const responses = await Promise.allSettled(requests);

        const success = responses.filter(
            (r) => r.status === "fulfilled" && r.value.status === 201,
        ).length;
        const failed = responses.filter(
            (r) => r.status === "fulfilled" && r.value.status === 400,
        ).length;

        expect(success).toBe(2);
        expect(failed).toBe(1);

        responses.forEach((r) => {
            if (r.status === "fulfilled" && r.value.status === 201) {
                createdPembayaranIds.push(r.value.body.data.id);
            }
        });

        const kartu = await prisma.kartuPiutangOutlet.findUnique({ where: { id: kartuPiutangId } });
        expect(kartu?.sisa_piutang.toNumber()).toBe(1000);
    });

    it("7. Rollback: Gagal setelah generator tidak mengubah saldo & sequence", async () => {
        const dateKey = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        const seqBefore = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "KW", date_key: dateKey } },
        });
        const lastNumBefore = seqBefore?.last_number || 0;

        const auditLogService = app.get(AuditLogService);
        const logSpy = jest.spyOn(auditLogService, "log")
            .mockRejectedValueOnce(new Error("Simulasi Gagal Database"));

        try {
            await reqPay(rollbackInvoiceId, 1000).expect(500);
        } finally {
            logSpy.mockRestore();
        }

        const count = await prisma.pembayaranInvoice.count({
            where: { invoice_outlet_id: rollbackInvoiceId },
        });
        expect(count).toBe(0);

        const kartu = await prisma.kartuPiutangOutlet.findUnique({ where: { id: rollbackKartuId } });
        expect(kartu?.sisa_piutang.toNumber()).toBe(10000);

        const seqAfter = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "KW", date_key: dateKey } },
        });
        expect(seqAfter?.last_number).toBe(lastNumBefore);
    });

    it("8. Invoice BATAL tidak bisa dibayar (404)", async () => {
        await prisma.invoiceOutlet.update({
            where: { id: rollbackInvoiceId },
            data: { status: "BATAL" },
        });
        await reqPay(rollbackInvoiceId, 1000).expect(404);
    });

    it("9. Invoice dengan status selain DRAFT ditolak (404)", async () => {
        await prisma.invoiceOutlet.update({
            where: { id: rollbackInvoiceId },
            data: { status: "PROSES" },
        });
        await reqPay(rollbackInvoiceId, 1000).expect(404);
    });

    it("10. Cross-User Idempotency Isolation (fresh invoices per user)", async () => {
        if (!tokenSecondUser || !secondUserId) {
            console.warn("Skip Test 10: Tidak ada user kedua di database.");
            return;
        }

        const key = `cross-user-kw-${runId}`;
        const tgl = "2026-11-14T10:00:00.000Z";

        // Fresh invoice for USER A (superadmin)
        const invA = await createFreshInvoice(userId, "ISO-A");
        // Fresh invoice for USER B
        const invB = await createFreshInvoice(secondUserId, "ISO-B");

        const payloadA = { invoice_outlet_id: invA, nominal_bayar: 100, tipe_bayar: "Tunai", tgl_bayar: tgl };
        const payloadB = { invoice_outlet_id: invB, nominal_bayar: 100, tipe_bayar: "Tunai", tgl_bayar: tgl };

        // User A pays A → 201
        const res1 = await reqPay(invA, 100, key, payloadA, false).expect(201);
        createdPembayaranIds.push(res1.body.data.id);

        // User B pays B (same key) → 201 (isolated by user.id + endpoint)
        const res2 = await reqPay(invB, 100, key, payloadB, true).expect(201);
        createdPembayaranIds.push(res2.body.data.id);

        expect(res1.body.data.id).not.toBe(res2.body.data.id);
        expect(res1.body.data.document_number).not.toBe(res2.body.data.document_number);
    });
});