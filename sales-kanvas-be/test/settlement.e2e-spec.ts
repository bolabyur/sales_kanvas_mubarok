import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { SettlementService } from "../src/transaksi/settlement/settlement.service";

describe("TASK 08.0.5.6 - STL Settlement (e2e)", () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let tokenA: string;
    let tokenB: string;
    let userIdA: number;
    let userIdB: number;

    let areaId: number | undefined;
    let vehicleId: number | undefined;

    let tempPermId: number | undefined;
    let tempRoleId: number | undefined;
    let permissionWasAlreadyAssigned = false;

    const runId = Date.now();
    const todayKey = (() => {
        const fmt = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
        });
        const parts = fmt.formatToParts(new Date());
        const y = parts.find((p) => p.type === "year")!.value;
        const m = parts.find((p) => p.type === "month")!.value;
        const d = parts.find((p) => p.type === "day")!.value;
        return `${y}${m}${d}`;
    })();

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api");
        await app.init();

        prisma = app.get(PrismaService);
        const jwtService = app.get(JwtService);

        const userA = await prisma.user.findUniqueOrThrow({
            where: { username: "superadmin" },
        });
        userIdA = userA.id;
        tokenA = jwtService.sign(
            { sub: userIdA, username: userA.username },
            { secret: process.env.JWT_SECRET || "secret" },
        );

        const salesUser = await prisma.user.findUniqueOrThrow({
            where: { username: "sales" },
        });
        userIdB = salesUser.id;
        tokenB = jwtService.sign(
            { sub: userIdB, username: salesUser.username },
            { secret: process.env.JWT_SECRET || "secret" },
        );

        const salesRole = await prisma.role.findUniqueOrThrow({
            where: { name: "Tim Sales Kanvas" },
        });
        const permWrite = await prisma.permission.findUniqueOrThrow({
            where: { name: "settlement:write" },
        });
        tempPermId = permWrite.id;
        tempRoleId = salesRole.id;

        const existing = await prisma.permissionRole.findFirst({
            where: { permission_id: tempPermId, role_id: tempRoleId },
        });
        permissionWasAlreadyAssigned = !!existing;
        if (!permissionWasAlreadyAssigned) {
            await prisma.permissionRole.create({
                data: { permission_id: tempPermId, role_id: tempRoleId },
            });
        }

        const area = await prisma.marketArea.create({
            data: { name: `Area-STL-${runId}`, user_id: userIdA, ip: "1" },
        });
        areaId = area.id;

        const vehicle = await prisma.vehicele.create({
            data: {
                name: `Truk-STL-${runId}`,
                nopol: `K${runId}`,
                type_vehicle: "Truk",
                type_fuel: "Solar",
                user_id: userIdA,
                ip: "1",
            },
        });
        vehicleId = vehicle.id;
    });

    afterAll(async () => {
        if (!app) return;
        try {
            if (areaId !== undefined) {
                const plans = await prisma.salesKanvasPlan.findMany({
                    where: { invoice: { startsWith: `INV-STL-${runId}` } },
                    select: { id: true },
                });
                const planIds = plans.map((p) => p.id);
                if (planIds.length > 0) {
                    await prisma.settlement.deleteMany({
                        where: { sales_kanvas_plan_id: { in: planIds } },
                    });
                    await prisma.salesKanvasPlan.deleteMany({
                        where: { id: { in: planIds } },
                    });
                }
            }
            if (vehicleId !== undefined) {
                await prisma.vehicele.deleteMany({ where: { id: vehicleId } });
            }
            if (areaId !== undefined) {
                await prisma.marketArea.deleteMany({ where: { id: areaId } });
            }
            if (
                !permissionWasAlreadyAssigned &&
                tempPermId !== undefined &&
                tempRoleId !== undefined
            ) {
                await prisma.permissionRole.deleteMany({
                    where: { permission_id: tempPermId, role_id: tempRoleId },
                });
            }
        } finally {
            await app.close();
        }
    });

    // W1=B': default status sekarang SELESAI (hanya status ini yang boleh settle)
    const createPlan = async (suffix: string, status = "SELESAI") => {
        if (areaId === undefined || vehicleId === undefined) {
            throw new Error("fixture not ready");
        }
        const plan = await prisma.salesKanvasPlan.create({
            data: {
                invoice: `INV-STL-${runId}-${suffix}`,
                tgl_invoice: new Date(),
                tgl_pergi_kanvas: new Date(),
                market_area_id: areaId,
                vehicle_id: vehicleId,
                status,
                user_id: userIdA,
                ip: "1",
            },
        });
        return plan.id;
    };

    const reqCreate = (
        planId: number,
        uangFisik: number,
        key?: string,
        token = tokenA,
    ) => {
        const payload = {
            sales_kanvas_plan_id: planId,
            uang_fisik_diterima: uangFisik,
        };
        const req = request(app.getHttpServer())
            .post("/api/transaksi/settlement")
            .set("Authorization", `Bearer ${token}`)
            .send(payload);
        if (key) req.set("x-idempotency-key", key);
        return req;
    };

    // ==================== A. Create & Validation ====================
    it("A. Create valid: STL number, uang fisik tersimpan, plan Settled", async () => {
        const planId = await createPlan("A");
        const res = await reqCreate(planId, 100000).expect(201);

        expect(res.body.data.document_number).toMatch(
            new RegExp(`^STL-${todayKey}-\\d{3}$`),
        );
        expect(res.body.data.status).toBe("Closed");
        expect(Number(res.body.data.uang_fisik_diterima)).toBe(100000);
        expect(Number(res.body.data.total_penjualan_tunai)).toBe(0);
        expect(Number(res.body.data.total_kasbon_realisasi)).toBe(0);
        expect(Number(res.body.data.selisih_kas)).toBe(100000);
        expect(res.body.data.user_id).toBe(userIdA);
        expect(res.body.data.tgl_settlement).toBeTruthy();
        expect(res.body.data.approved_by).toBeNull();

        const plan = await prisma.salesKanvasPlan.findUniqueOrThrow({
            where: { id: planId },
        });
        expect(plan.status).toBe("Settled");
    });

    it("B. DTO invalid: uang_fisik negatif → 400", async () => {
        const planId = await createPlan("B");
        await reqCreate(planId, -100).expect(400);
    });

    it("C. Plan tidak ada → 404", async () => {
        await reqCreate(999999999, 1000).expect(404);
    });

    it("D. Plan status BATAL → 400", async () => {
        const planId = await createPlan("D", "BATAL");
        await reqCreate(planId, 1000).expect(400);
    });

    // ==================== E. Duplicate prevention ====================
    it("E. Duplicate: plan sudah di-settle, key beda → 400/409", async () => {
        const planId = await createPlan("E");
        await reqCreate(planId, 1000, `dup-e-1-${runId}`).expect(201);
        await reqCreate(planId, 1000, `dup-e-2-${runId}`).expect((res) => {
            expect([400, 409]).toContain(res.status);
        });
    });

    // ==================== F. Idempotency replay ====================
    it("F. Replay same key+payload: settlement sama, sequence +1", async () => {
        const planId = await createPlan("F");
        const key = `replay-f-${runId}`;

        const seqBefore = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "STL", date_key: todayKey } },
        });
        const lastBefore = seqBefore?.last_number || 0;

        const res1 = await reqCreate(planId, 1000, key).expect(201);
        const res2 = await reqCreate(planId, 1000, key).expect(201);

        expect(res1.body.data.id).toBe(res2.body.data.id);
        expect(res1.body.data.document_number).toBe(res2.body.data.document_number);

        const seqAfter = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "STL", date_key: todayKey } },
        });
        expect(seqAfter?.last_number).toBe(lastBefore + 1);
    });

    it("G. Same key, payload beda → 409", async () => {
        const planId = await createPlan("G");
        const key = `conflict-g-${runId}`;
        await reqCreate(planId, 1000, key).expect(201);
        await reqCreate(planId, 5000, key).expect(409);
    });

    // ==================== H. Concurrent same key ====================
    it("H. Concurrent same key: 5 request, 1 settlement", async () => {
        const planId = await createPlan("H");
        const key = `conc-same-h-${runId}`;
        const requests = Array(5)
            .fill(null)
            .map(() => reqCreate(planId, 1000, key));
        const responses = await Promise.all(requests);

        const ok = responses.filter((r) => r.status === 201);
        expect(ok.length).toBeGreaterThanOrEqual(1);
        const ids = new Set(ok.map((r) => r.body.data.id));
        expect(ids.size).toBe(1);

        const count = await prisma.settlement.count({
            where: { sales_kanvas_plan_id: planId, is_deleted: false },
        });
        expect(count).toBe(1);
    }, 30000);

    // ==================== I. Cross-user isolation ====================
    it("I. Cross-user: key sama dari 2 user → settlement berbeda", async () => {
        const planId1 = await createPlan("I-A");
        const planId2 = await createPlan("I-B");
        const key = `cross-i-${runId}`;

        const resA = await reqCreate(planId1, 1000, key, tokenA).expect(201);
        const resB = await reqCreate(planId2, 1000, key, tokenB).expect(201);

        expect(resA.body.data.id).not.toBe(resB.body.data.id);
        expect(resA.body.data.document_number).not.toBe(
            resB.body.data.document_number,
        );
    });

    // ==================== J. Concurrent different keys (RACE) ====================
    it("J. Concurrent different keys, plan sama: hanya 1 berhasil, sequence +1", async () => {
        const planId = await createPlan("J");

        const seqBefore = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "STL", date_key: todayKey } },
        });
        const lastBefore = seqBefore?.last_number || 0;

        const requests = Array(10)
            .fill(null)
            .map((_, i) => reqCreate(planId, 1000, `conc-diff-j-${runId}-${i}`));
        const responses = await Promise.all(requests);

        const ok = responses.filter((r) => r.status === 201);
        const fail = responses.filter((r) => r.status !== 201);
        expect(ok.length).toBe(1);
        expect(fail.length).toBe(9);
        fail.forEach((r) => expect([400, 409, 503]).toContain(r.status));

        const count = await prisma.settlement.count({
            where: { sales_kanvas_plan_id: planId, is_deleted: false },
        });
        expect(count).toBe(1);

        const seqAfter = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "STL", date_key: todayKey } },
        });
        expect(seqAfter?.last_number).toBe(lastBefore + 1);
    }, 30000);

    // ==================== K. Historical compatibility ====================
    it("K. Historical: settlement lama document_number NULL tetap terbaca", async () => {
        const planId = await createPlan("K");
        const legacy = await prisma.settlement.create({
            data: {
                sales_kanvas_plan_id: planId,
                status: "Closed",
                document_number: null,
                idempotency_key: null,
            },
        });
        const found = await prisma.settlement.findUniqueOrThrow({
            where: { id: legacy.id },
        });
        expect(found.document_number).toBeNull();
        expect(found.uang_fisik_diterima).toBeNull();
        expect(found.tgl_settlement).toBeNull();
        expect(found.user_id).toBeNull();
    });

    // ==================== L. Rollback setelah generator ====================
    it("L. Rollback: generator jalan, tapi sequence & settlement di-rollback", async () => {
        const planId = await createPlan("L");

        const seqBefore = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "STL", date_key: todayKey } },
        });
        const lastBefore = seqBefore?.last_number || 0;

        const svc = app.get(SettlementService) as any;
        const originalGenerate = svc.codeGenerator.generate.bind(svc.codeGenerator);

        const genSpy = jest.spyOn(svc.codeGenerator, "generate");
        (genSpy as any).mockImplementationOnce(async (...args: any[]) => {
            const [tx, prefix, date] = args;
            await originalGenerate(tx, prefix as string, date as Date);
            throw new Error("FORCED_ROLLBACK_AFTER_GENERATOR");
        });

        try {
            await reqCreate(planId, 1000).expect(500);
            expect(genSpy).toHaveBeenCalled();
        } finally {
            genSpy.mockRestore();
        }

        const seqAfter = await prisma.documentSequence.findUnique({
            where: { prefix_date_key: { prefix: "STL", date_key: todayKey } },
        });
        expect(seqAfter?.last_number || 0).toBe(lastBefore);

        const count = await prisma.settlement.count({
            where: { sales_kanvas_plan_id: planId },
        });
        expect(count).toBe(0);

        const plan = await prisma.salesKanvasPlan.findUniqueOrThrow({
            where: { id: planId },
        });
        expect(plan.status).not.toBe("Settled");

        const retryRes = await reqCreate(planId, 1000).expect(201);
        const retryNum = parseInt(
            retryRes.body.data.document_number.split("-")[2],
            10,
        );
        expect(retryNum).toBe(lastBefore + 1);
    });

    // ==================== M. Authorization ====================
    it("M. Tanpa token → 401", async () => {
        const planId = await createPlan("M");
        await request(app.getHttpServer())
            .post("/api/transaksi/settlement")
            .send({ sales_kanvas_plan_id: planId, uang_fisik_diterima: 1000 })
            .expect(401);
    });

    // ==================== N. Client tidak bisa set approved_by ====================
    it("N. approved_by dari client di-strip → NULL", async () => {
        const planId = await createPlan("N");
        const res = await request(app.getHttpServer())
            .post("/api/transaksi/settlement")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({
                sales_kanvas_plan_id: planId,
                uang_fisik_diterima: 1000,
                approved_by: 99999,
            })
            .expect(201);

        expect(res.body.data.approved_by).toBeNull();
    });

    // ==================== O–S. W1=B': Status rejection ====================
    it("O. Plan DRAFT → 400 (hanya SELESAI yang boleh settle)", async () => {
        const planId = await createPlan("O", "DRAFT");
        await reqCreate(planId, 1000).expect(400);
    });

    it("P. Plan DISETUJUI → 400", async () => {
        const planId = await createPlan("P", "DISETUJUI");
        await reqCreate(planId, 1000).expect(400);
    });

    it("Q. Plan LOADING → 400", async () => {
        const planId = await createPlan("Q", "LOADING");
        await reqCreate(planId, 1000).expect(400);
    });

    it("R. Plan KOMPLIT → 400 (harus transisi ke SELESAI dulu)", async () => {
        const planId = await createPlan("R", "KOMPLIT");
        await reqCreate(planId, 1000).expect(400);
    });

    it("S. Plan Settled → 400 (sudah di-settle)", async () => {
        const planId = await createPlan("S", "Settled");
        await reqCreate(planId, 1000).expect(400);
    });
});
