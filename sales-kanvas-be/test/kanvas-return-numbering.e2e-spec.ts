import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { CodeGeneratorService } from "../src/common/services/code-generator.service";

describe("TASK 08.0.5.3 - Retur Sales RTS Numbering & Concurrency (e2e)", () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let token: string;
    let tokenSecondUser: string;
    let userId: number;

    let planId: number;
    let gudangId: number;
    let produkId: number;
    let batchId: number;

    const createdReturnIds: number[] = [];
    const createdPlanIds: number[] = [];
    const createdAreaIds: number[] = [];
    const createdVehIds: number[] = [];
    const createdGudangIds: number[] = [];
    const createdProdukIds: number[] = [];
    const createdBatchIds: number[] = [];
    const createdOutletIds: number[] = [];
    const createdTipeHargaIds: number[] = [];

    const runId = Date.now();

    const getJakartaDateKey = (date: Date = new Date()): string => {
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const formatted = formatter.format(date);
        const [year, month, day] = formatted.split("-");
        return `${year.slice(2)}${month}${day}`;
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api");
        await app.init();

        prisma = app.get(PrismaService);
        const jwtService = app.get(JwtService);

        const user = await prisma.user.findUniqueOrThrow({
            where: { username: "superadmin" },
        });
        userId = user.id;
        token = jwtService.sign(
            { sub: userId, username: user.username },
            { secret: process.env.JWT_SECRET || "secret" },
        );

        const secondUser = await prisma.user.findFirst({
            where: {
                id: { not: userId },
                role: {
                    permissionRoles: { some: { permission: { name: "retur:create" } } },
                },
            },
        });

        if (!secondUser)
            throw new Error("FATAL: Fixture user kedua tidak ditemukan.");
        tokenSecondUser = jwtService.sign(
            { sub: secondUser.id, username: secondUser.username },
            { secret: process.env.JWT_SECRET || "secret" },
        );

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
                name: `V-${runId}`,
                nopol: `K${runId}`,
                type_vehicle: "T",
                type_fuel: "S",
                user_id: userId,
                ip: "1",
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
        planId = plan.id;
        createdPlanIds.push(plan.id);

        const gudang = await prisma.gudang.create({
            data: { nama_gudang: `G-${runId}`, tipe_gudang: "Barang Jadi" },
        });
        gudangId = gudang.id;
        createdGudangIds.push(gudang.id);

        const produk = await prisma.product.create({
            data: {
                name: `Prod-${runId}`,
                code: `P-${runId}`,
                barcode: `B-${runId}`,
                product_brand_id: 1,
                product_type_id: 1,
                sale_report_group_id: 1,
                supplier_id: 1,
                is_active: true,
                type_price: "FIXED",
                user_id: userId,
                ip: "1",
            },
        });
        produkId = produk.id;
        createdProdukIds.push(produk.id);

        const batch = await prisma.batch.create({
            data: {
                produk_id: produkId,
                no_batch: `BATCH-${runId}`,
                expired_date: new Date(
                    new Date().setFullYear(new Date().getFullYear() + 1),
                ),
                stok_gudang: 0,
            },
        });
        batchId = batch.id;
        createdBatchIds.push(batch.id);
    });

    afterAll(async () => {
        if (!app) return;

        const safeReturnIds = createdReturnIds.filter((id) => id !== undefined);
        const safePlanIds = createdPlanIds.filter((id) => id !== undefined);
        const safeAreaIds = createdAreaIds.filter((id) => id !== undefined);
        const safeVehIds = createdVehIds.filter((id) => id !== undefined);
        const safeGudangIds = createdGudangIds.filter((id) => id !== undefined);
        const safeProdukIds = createdProdukIds.filter((id) => id !== undefined);
        const safeBatchIds = createdBatchIds.filter((id) => id !== undefined);
        const safeOutletIds = createdOutletIds.filter((id) => id !== undefined);
        const safeTipeHargaIds = createdTipeHargaIds.filter(
            (id) => id !== undefined,
        );

        if (safeBatchIds.length > 0)
            await prisma.mutasiBatch.deleteMany({
                where: { batch_id: { in: safeBatchIds } },
            });
        if (safeReturnIds.length > 0) {
            await prisma.returReceipt.deleteMany({
                where: { kanvas_return_id: { in: safeReturnIds } },
            });
            await prisma.kanvasReturnDetail.deleteMany({
                where: { kanvas_return_id: { in: safeReturnIds } },
            });
            await prisma.kanvasReturn.deleteMany({
                where: { id: { in: safeReturnIds } },
            });
        }
        if (safePlanIds.length > 0) {
            const orphanReturns = await prisma.kanvasReturn.findMany({
                where: { sales_kanvas_plan_id: { in: safePlanIds } },
            });
            if (orphanReturns.length > 0) {
                const orphanIds = orphanReturns.map((o) => o.id);
                await prisma.returReceipt.deleteMany({
                    where: { kanvas_return_id: { in: orphanIds } },
                });
                await prisma.kanvasReturnDetail.deleteMany({
                    where: { kanvas_return_id: { in: orphanIds } },
                });
                await prisma.kanvasReturn.deleteMany({
                    where: { id: { in: orphanIds } },
                });
            }
        }

        if (safePlanIds.length > 0)
            await prisma.salesKanvasPlan.deleteMany({
                where: { id: { in: safePlanIds } },
            });
        if (safeAreaIds.length > 0)
            await prisma.marketArea.deleteMany({
                where: { id: { in: safeAreaIds } },
            });
        if (safeVehIds.length > 0)
            await prisma.vehicele.deleteMany({ where: { id: { in: safeVehIds } } });
        if (safeGudangIds.length > 0)
            await prisma.gudang.deleteMany({ where: { id: { in: safeGudangIds } } });
        if (safeBatchIds.length > 0)
            await prisma.batch.deleteMany({ where: { id: { in: safeBatchIds } } });
        if (safeProdukIds.length > 0)
            await prisma.product.deleteMany({ where: { id: { in: safeProdukIds } } });
        if (safeOutletIds.length > 0)
            await prisma.outlet.deleteMany({ where: { id: { in: safeOutletIds } } });
        if (safeTipeHargaIds.length > 0)
            await prisma.tipeHarga.deleteMany({
                where: { id: { in: safeTipeHargaIds } },
            });

        await app.close();
    });

    const reqCreate = (
        key?: string,
        customPayload?: any,
        useSecondToken = false,
    ) => {
        const payload = customPayload || {
            sales_kanvas_plan_id: planId,
            gudang_tujuan_id: gudangId,
            tgl_retur: new Date().toISOString(),
            details: [
                { batch_id: batchId, produk_id: produkId, qty: 10, kondisi: "BAGUS" },
            ],
        };
        const req = request(app.getHttpServer())
            .post("/api/transaksi/kanvas-return")
            .set(
                "Authorization",
                `Bearer ${useSecondToken ? tokenSecondUser : token}`,
            )
            .send(payload);
        if (key) req.set("x-idempotency-key", key);
        return req;
    };

    // 1. Sequential Numbering + Assertion Counter
    it("1 & 2. Sequential Numbering RTS-YYMMDD-NNN", async () => {
        const res1 = await reqCreate().expect(201);
        createdReturnIds.push(res1.body.data.id);
        expect(res1.body.data.document_number).toMatch(/^RTS-\d{6}-\d{3}$/);

        const num1 = parseInt(res1.body.data.document_number.split("-")[2], 10);

        const res2 = await reqCreate().expect(201);
        createdReturnIds.push(res2.body.data.id);
        expect(res2.body.data.document_number).toMatch(/^RTS-\d{6}-\d{3}$/);

        const num2 = parseInt(res2.body.data.document_number.split("-")[2], 10);
        expect(num2).toBe(num1 + 1); // 🔥 Counter harus bertambah 1
    });

    // 3. Concurrent Same-Key: 5 request paralel = 1 dokumen
    it("3. Concurrent Same-Key: 5 request paralel = 1 dokumen", async () => {
        const key = `same-key-rts-${runId}`;
        const staticPayload = {
            sales_kanvas_plan_id: planId,
            gudang_tujuan_id: gudangId,
            tgl_retur: "2026-11-14T10:00:00.000Z",
            details: [
                { batch_id: batchId, produk_id: produkId, qty: 3, kondisi: "BAGUS" },
            ],
        };

        // 🔥 FIX: Gunakan tanggal dari payload untuk dateKey, bukan waktu sistem
        const payloadDate = new Date(staticPayload.tgl_retur);
        const dateKey = getJakartaDateKey(payloadDate);

        const seqBefore = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "RTS", date_key: dateKey } },
        });
        const lastNumBefore = seqBefore?.last_number || 0;

        const requests = Array(5)
            .fill(null)
            .map(() => reqCreate(key, staticPayload));
        const responses = await Promise.all(requests);

        responses.forEach((res) => expect(res.status).toBe(201));

        const ids = new Set(responses.map((r) => r.body.data.id));
        expect(ids.size).toBe(1);
        createdReturnIds.push(Array.from(ids)[0]);

        const docNumbers = new Set(
            responses.map((r) => r.body.data.document_number),
        );
        expect(docNumbers.size).toBe(1);

        const countDoc = await prisma.kanvasReturn.count({
            where: { id: Array.from(ids)[0] },
        });
        expect(countDoc).toBe(1);

        const countDetail = await prisma.kanvasReturnDetail.count({
            where: { kanvas_return_id: Array.from(ids)[0] },
        });
        expect(countDetail).toBe(1);

        const seqAfter = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "RTS", date_key: dateKey } },
        });
        expect(seqAfter?.last_number).toBe(lastNumBefore + 1);
    });

    // 4. Concurrent Different Keys: 10 request paralel = 10 nomor unik
    it("4. Concurrent Different Keys: 10 request paralel = 10 nomor unik", async () => {
        const todayKey = getJakartaDateKey();
        const seqBefore = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "RTS", date_key: todayKey } },
        });
        const lastNumBefore = seqBefore?.last_number || 0;

        // 🔥 FIX: Gunakan idempotency key unik untuk masing-masing request
        const requests = Array(10)
            .fill(null)
            .map((_, i) => {
                const uniqueKey = `different-key-rts-${runId}-${i}`;
                return reqCreate(uniqueKey);
            });

        const responses = await Promise.all(requests);

        const ids = new Set<number>();
        const docNumbers = new Set<string>();

        responses.forEach((res) => {
            expect(res.status).toBe(201);
            const docId = res.body.data.id;
            const docNum = res.body.data.document_number;

            ids.add(docId);
            docNumbers.add(docNum);
            createdReturnIds.push(docId);
        });

        expect(ids.size).toBe(10); // 10 ID unik
        expect(docNumbers.size).toBe(10); // 10 Nomor unik

        // Verifikasi database
        const countDocs = await prisma.kanvasReturn.count({
            where: { id: { in: Array.from(ids) } },
        });
        expect(countDocs).toBe(10);

        const seqAfter = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "RTS", date_key: todayKey } },
        });
        expect(seqAfter?.last_number).toBe(lastNumBefore + 10); // Sequence + 10
    }, 30000);

    // 5. Replay & Diff Payload Conflict
    it("5. Replay & Diff Payload Conflict", async () => {
        const key = `conflict-rts-${runId}`;
        const staticPayload = {
            sales_kanvas_plan_id: planId,
            gudang_tujuan_id: gudangId,
            tgl_retur: "2026-11-14T10:00:00.000Z",
            details: [
                { batch_id: batchId, produk_id: produkId, qty: 5, kondisi: "BAGUS" },
            ],
        };

        const res1 = await reqCreate(key, staticPayload).expect(201);
        createdReturnIds.push(res1.body.data.id);

        const res2 = await reqCreate(key, staticPayload).expect(201);
        expect(res1.body.data.id).toBe(res2.body.data.id);

        const conflictPayload = {
            ...staticPayload,
            details: [
                { batch_id: batchId, produk_id: produkId, qty: 99, kondisi: "BAGUS" },
            ],
        };
        await reqCreate(key, conflictPayload).expect(409);
    });

    // 6. Cross-User Isolation
    it("6. Cross-User Isolation", async () => {
        const key = `cross-rts-${runId}`;
        const payload = {
            sales_kanvas_plan_id: planId,
            gudang_tujuan_id: gudangId,
            tgl_retur: "2026-11-14T10:00:00.000Z",
            details: [
                { batch_id: batchId, produk_id: produkId, qty: 2, kondisi: "BAGUS" },
            ],
        };

        const res1 = await reqCreate(key, payload, false).expect(201);
        createdReturnIds.push(res1.body.data.id);

        const res2 = await reqCreate(key, payload, true).expect(201);
        createdReturnIds.push(res2.body.data.id);

        expect(res1.body.data.id).not.toBe(res2.body.data.id);
    });

    // 7. Rollback Sequence
    it("7. Rollback Sequence: Generator runs then transaction fails", async () => {
        const dateKey = getJakartaDateKey();
        const seqBefore = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "RTS", date_key: dateKey } },
        });
        const lastNumBefore = seqBefore?.last_number || 0;

        const codeGenService = app.get(CodeGeneratorService);
        const originalGenerate = codeGenService.generate.bind(codeGenService);
        const spy = jest
            .spyOn(codeGenService, "generate")
            .mockImplementationOnce(async (tx, prefix, date) => {
                const result = await originalGenerate(tx, prefix, date);
                throw new Error("Simulasi Gagal Setelah Generate");
            });

        try {
            await reqCreate().expect(500);
        } finally {
            spy.mockRestore();
        }

        const seqAfter = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "RTS", date_key: dateKey } },
        });
        expect(seqAfter?.last_number).toBe(lastNumBefore);
    });

    // 8. Plan BATAL
    it("8. Plan BATAL tidak bisa diretur (400)", async () => {
        const batalPlan = await prisma.salesKanvasPlan.create({
            data: {
                invoice: `INV-BATAL-${runId}`,
                tgl_invoice: new Date(),
                tgl_pergi_kanvas: new Date(),
                market_area_id: createdAreaIds[0],
                vehicle_id: createdVehIds[0],
                status: "BATAL",
                user_id: userId,
                ip: "1",
            },
        });
        createdPlanIds.push(batalPlan.id);

        const payload = {
            sales_kanvas_plan_id: batalPlan.id,
            gudang_tujuan_id: gudangId,
            tgl_retur: new Date().toISOString(),
            details: [
                { batch_id: batchId, produk_id: produkId, qty: 1, kondisi: "BAGUS" },
            ],
        };

        await reqCreate(undefined, payload).expect(400);
    });

    // 9. Create Does Not Increase Stock
    it("9. Create does not increase stock or create mutasi", async () => {
        const stockBefore = (
            await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })
        ).stok_gudang;
        const mutasiBefore = await prisma.mutasiBatch.count({
            where: { batch_id: batchId },
        });

        const res = await reqCreate().expect(201);
        createdReturnIds.push(res.body.data.id);

        const stockAfter = (
            await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })
        ).stok_gudang;
        const mutasiAfter = await prisma.mutasiBatch.count({
            where: { batch_id: batchId },
        });

        expect(stockAfter).toBe(stockBefore);
        expect(mutasiAfter).toBe(mutasiBefore);
    });

    let test9ReturnId: number;

    // 10. Receive Partial BAGUS
    it("10. Receive Partial & Stock Update (BAGUS)", async () => {
        const res = await reqCreate().expect(201);
        test9ReturnId = res.body.data.id;
        createdReturnIds.push(test9ReturnId);

        const detail = await prisma.kanvasReturnDetail.findFirstOrThrow({
            where: { kanvas_return_id: test9ReturnId },
        });
        const stockBefore = (
            await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })
        ).stok_gudang;

        await request(app.getHttpServer())
            .post(`/api/transaksi/kanvas-return/${test9ReturnId}/receive`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                details: [{ detail_id: detail.id, qty_diterima: 4, kondisi: "BAGUS" }],
            })
            .expect(201);

        const batch = await prisma.batch.findUniqueOrThrow({
            where: { id: batchId },
        });
        expect(batch.stok_gudang).toBe(stockBefore + 4);

        const detailAfter = await prisma.kanvasReturnDetail.findUniqueOrThrow({
            where: { id: detail.id },
        });
        expect(detailAfter.qty_diterima).toBe(4);
    });

    // 11. Receive Idempotency
    it("11. Receive Idempotency Replay", async () => {
        const returnRecord = await prisma.kanvasReturn.findUniqueOrThrow({
            where: { id: test9ReturnId },
        });
        const detail = await prisma.kanvasReturnDetail.findFirstOrThrow({
            where: { kanvas_return_id: returnRecord.id },
        });

        const stockBefore = (
            await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })
        ).stok_gudang;
        const qtyDiterimaBefore = detail.qty_diterima;
        const mutasiBefore = await prisma.mutasiBatch.count({
            where: { batch_id: batchId },
        });

        const receivePayload = {
            details: [{ detail_id: detail.id, qty_diterima: 1, kondisi: "BAGUS" }],
        };
        const key = `recv-idem-rts-${runId}`;

        await request(app.getHttpServer())
            .post(`/api/transaksi/kanvas-return/${returnRecord.id}/receive`)
            .set("Authorization", `Bearer ${token}`)
            .set("x-idempotency-key", key)
            .send(receivePayload)
            .expect(201);
        await request(app.getHttpServer())
            .post(`/api/transaksi/kanvas-return/${returnRecord.id}/receive`)
            .set("Authorization", `Bearer ${token}`)
            .set("x-idempotency-key", key)
            .send(receivePayload)
            .expect(201);

        const stockAfter = (
            await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })
        ).stok_gudang;
        const detailAfter = await prisma.kanvasReturnDetail.findUniqueOrThrow({
            where: { id: detail.id },
        });
        const mutasiAfter = await prisma.mutasiBatch.count({
            where: { batch_id: batchId },
        });

        expect(stockAfter).toBe(stockBefore + 1);
        expect(detailAfter.qty_diterima).toBe(qtyDiterimaBefore + 1);
        expect(mutasiAfter).toBe(mutasiBefore + 1);
    });

    // 12. Receive RUSAK
    it("12. Receive Condition RUSAK (Stok tidak bertambah)", async () => {
        const res = await reqCreate().expect(201);
        createdReturnIds.push(res.body.data.id);
        const returId = res.body.data.id;

        const detail = await prisma.kanvasReturnDetail.findFirstOrThrow({
            where: { kanvas_return_id: returId },
        });
        const stockBefore = (
            await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })
        ).stok_gudang;

        await request(app.getHttpServer())
            .post(`/api/transaksi/kanvas-return/${returId}/receive`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                details: [{ detail_id: detail.id, qty_diterima: 2, kondisi: "RUSAK" }],
            })
            .expect(201);

        const stockAfter = (
            await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })
        ).stok_gudang;
        expect(stockAfter).toBe(stockBefore);
    });

    // 13. Receive EXPIRED (NEW TEST)
    it("13. Receive Condition EXPIRED (Stok tidak bertambah)", async () => {
        const res = await reqCreate().expect(201);
        createdReturnIds.push(res.body.data.id);
        const returId = res.body.data.id;

        const detail = await prisma.kanvasReturnDetail.findFirstOrThrow({
            where: { kanvas_return_id: returId },
        });
        const stockBefore = (
            await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })
        ).stok_gudang;

        await request(app.getHttpServer())
            .post(`/api/transaksi/kanvas-return/${returId}/receive`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                details: [
                    { detail_id: detail.id, qty_diterima: 3, kondisi: "EXPIRED" },
                ],
            })
            .expect(201);

        const stockAfter = (
            await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })
        ).stok_gudang;
        expect(stockAfter).toBe(stockBefore); // Stok TETAP

        // Verifikasi Mutasi tercatat sebagai IN_RUSAK
        const mutasi = await prisma.mutasiBatch.findFirstOrThrow({
            where: { batch_id: batchId, tipe_mutasi: "IN_RUSAK" },
            orderBy: { id: "desc" },
        });
        expect(mutasi.qty).toBe(3);
    });

    // 14. Over Receive
    it("14. Over Receive ditolak (400)", async () => {
        const res = await reqCreate().expect(201);
        createdReturnIds.push(res.body.data.id);
        const returId = res.body.data.id;

        const detail = await prisma.kanvasReturnDetail.findFirstOrThrow({
            where: { kanvas_return_id: returId },
        });

        await request(app.getHttpServer())
            .post(`/api/transaksi/kanvas-return/${returId}/receive`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                details: [{ detail_id: detail.id, qty_diterima: 11, kondisi: "BAGUS" }],
            })
            .expect(400);
    });
});
