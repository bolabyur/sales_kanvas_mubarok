import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("TASK 08.0.5.1 - LDG Numbering & Concurrency (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let token: string;
  let userId: number;
  let gudangId: number;
  let produkId: number;
  let batchId: number;

  const runId = Date.now();

  // Track ALL created resources — cleanup in afterAll
  const createdProdukOutIds: number[] = [];
  const createdPlanIds: number[] = [];
  const createdBonIds: number[] = [];
  const createdAreaIds: number[] = [];
  const createdVehicleIds: number[] = [];
  const createdBatchIds: number[] = [];

  const todayKey = (() => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    });
    const [y, m, d] = fmt.format(new Date()).split("-");
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
    jwtService = app.get(JwtService);

    // ⚠️ SELF-HEALING: ensure LDG sequence >= max existing document_number
    // Prevents P2002 if sequence was wiped (e.g. by an earlier test run).
    // Additive only — GREATEST() never decreases an existing value.
    await prisma.$executeRawUnsafe(`
      INSERT INTO document_sequence (prefix, date_key, last_number)
      SELECT
        'LDG',
        SUBSTRING(document_number FROM '^LDG-([0-9]{6})-') AS date_key,
        MAX(CAST(SUBSTRING(document_number FROM '-([0-9]+)$') AS INTEGER)) AS max_num
      FROM produk_out
      WHERE document_number ~ '^LDG-[0-9]{6}-[0-9]+$'
      GROUP BY SUBSTRING(document_number FROM '^LDG-([0-9]{6})-')
      ON CONFLICT (prefix, date_key)
      DO UPDATE SET last_number = GREATEST(document_sequence.last_number, EXCLUDED.last_number)
    `);

    const existingUser = await prisma.user.findUniqueOrThrow({
      where: { username: "superadmin" },
    });
    userId = existingUser.id;
    token = jwtService.sign(
      { sub: userId, username: existingUser.username },
      { secret: process.env.JWT_SECRET || "secret" },
    );

    const gudang = await prisma.gudang.create({
      data: { nama_gudang: `G-LDG-${runId}`, tipe_gudang: "Utama" },
    });
    gudangId = gudang.id;

    const produk = await prisma.product.create({
      data: {
        name: `Prod-LDG-${runId}`,
        code: `P-LDG-${runId}`,
        barcode: `B-LDG-${runId}`,
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

    const batch = await prisma.batch.create({
      data: {
        produk_id: produk.id,
        no_batch: `BATCH-LDG-${runId}`,
        expired_date: new Date("2028-01-01"),
        stok_gudang: 1000,
      },
    });
    batchId = batch.id;
  });

  afterAll(async () => {
    if (!app) return;
    try {
      if (createdProdukOutIds.length > 0) {
        await prisma.detailProdukOut.deleteMany({
          where: { produk_out_id: { in: createdProdukOutIds } },
        }).catch(() => {});
        await prisma.produkOut.deleteMany({
          where: { id: { in: createdProdukOutIds } },
        }).catch(() => {});
      }

      if (createdBonIds.length > 0) {
        await prisma.detailKasbonProduk.deleteMany({
          where: { kasbon_produk_id: { in: createdBonIds } },
        }).catch(() => {});
        await prisma.kasbonProduk.deleteMany({
          where: { id: { in: createdBonIds } },
        }).catch(() => {});
      }

      if (createdPlanIds.length > 0) {
        await prisma.salesKanvasPersonil.deleteMany({
          where: { sales_kanvas_plan_id: { in: createdPlanIds } },
        }).catch(() => {});
        await prisma.salesKanvasPlan.deleteMany({
          where: { id: { in: createdPlanIds } },
        }).catch(() => {});
      }

      const allBatchIds = [...createdBatchIds, batchId].filter((x) => x != null);
      if (allBatchIds.length > 0) {
        await prisma.mutasiBatch.deleteMany({
          where: { batch_id: { in: allBatchIds } },
        }).catch(() => {});
        await prisma.batch.deleteMany({
          where: { id: { in: allBatchIds } },
        }).catch(() => {});
      }

      if (produkId)
        await prisma.product.deleteMany({ where: { id: produkId } }).catch(() => {});
      if (gudangId)
        await prisma.gudang.deleteMany({ where: { id: gudangId } }).catch(() => {});
      if (createdVehicleIds.length > 0)
        await prisma.vehicele.deleteMany({
          where: { id: { in: createdVehicleIds } },
        }).catch(() => {});
      if (createdAreaIds.length > 0)
        await prisma.marketArea.deleteMany({
          where: { id: { in: createdAreaIds } },
        }).catch(() => {});

      // ⚠️ DO NOT delete documentSequence — leave growing to prevent future collisions
    } finally {
      await app.close();
    }
  });

  const createNewBon = async (qty: number = 1) => {
    const uid = `${runId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const area = await prisma.marketArea.create({
      data: { name: `Area-LDG-${uid}`, user_id: 1, ip: "1" },
    });
    createdAreaIds.push(area.id);

    const veh = await prisma.vehicele.create({
      data: {
        name: `Veh-LDG-${uid}`,
        nopol: `K${uid}`,
        type_vehicle: "Truk",
        type_fuel: "Solar",
        user_id: 1,
        ip: "1",
      },
    });
    createdVehicleIds.push(veh.id);

    const plan = await prisma.salesKanvasPlan.create({
      data: {
        invoice: `INV-LDG-${uid}`,
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

    const bon = await prisma.kasbonProduk.create({
      data: {
        sales_kanvas_plan_id: plan.id,
        status: "DRAFT",
        user_id: userId,
        ip: "1",
      },
    });
    createdBonIds.push(bon.id);

    await prisma.detailKasbonProduk.create({
      data: {
        kasbon_produk_id: bon.id,
        produk_id: produkId,
        qty_bawa: qty,
        batch_id: null,
      },
    });

    return bon.id;
  };

  const reqCreate = (bonIdForRequest: number, key?: string, customPayload?: any) => {
    const payload = customPayload || {
      kasbon_produk_id: bonIdForRequest,
      gudang_id: gudangId,
      tgl_keluar: new Date().toISOString(),
      source_type: "SALES_KANVAS",
    };
    const req = request(app.getHttpServer())
      .post("/api/transaksi/produk-out")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);
    if (key) req.set("x-idempotency-key", key);
    return req;
  };

  it("1 & 2. Sequential Create (delta by 1)", async () => {
    const bon1 = await createNewBon();
    const res1 = await reqCreate(bon1).expect(201);
    createdProdukOutIds.push(res1.body.data.id);
    expect(res1.body.data.document_number).toMatch(/^LDG-\d{6}-\d{3,}$/);
    const num1 = parseInt(res1.body.data.document_number.split("-")[2], 10);

    const bon2 = await createNewBon();
    const res2 = await reqCreate(bon2).expect(201);
    createdProdukOutIds.push(res2.body.data.id);
    expect(res2.body.data.document_number).toMatch(/^LDG-\d{6}-\d{3,}$/);
    const num2 = parseInt(res2.body.data.document_number.split("-")[2], 10);

    expect(num2).toBe(num1 + 1);
  });

  it("5. Concurrency: 10 request bersamaan menghasilkan 10 nomor unik", async () => {
    const bons = await Promise.all(
      Array(10).fill(null).map(() => createNewBon()),
    );
    const requests = bons.map((id) => reqCreate(id));
    const responses = await Promise.all(requests);

    responses.forEach((res) => {
      expect(res.status).toBe(201);
      createdProdukOutIds.push(res.body.data.id);
    });

    const docNumbers = responses.map((r) => r.body.data.document_number);
    const uniqueNumbers = new Set(docNumbers);
    expect(uniqueNumbers.size).toBe(10);
  }, 30000);

  it("6. Idempotency: Replay menghasilkan dokumen & nomor yang sama", async () => {
    const bon = await createNewBon();
    const key = `idem-ldg-${runId}-${Date.now()}`;

    const staticPayload = {
      kasbon_produk_id: bon,
      gudang_id: gudangId,
      tgl_keluar: new Date().toISOString(),
      source_type: "SALES_KANVAS",
    };

    const res1 = await reqCreate(bon, key, staticPayload).expect(201);
    createdProdukOutIds.push(res1.body.data.id);
    const res2 = await reqCreate(bon, key, staticPayload).expect(201);

    expect(res1.body.data.id).toBe(res2.body.data.id);
    expect(res1.body.data.document_number).toBe(res2.body.data.document_number);
  });

  it("2.2 & 2.3 Idempotency: Conflict Payload & Concurrent Same Key", async () => {
    const bon = await createNewBon();
    const key = `idem-conflict-${runId}-${Date.now()}`;

    const res1 = await reqCreate(bon, key).expect(201);
    createdProdukOutIds.push(res1.body.data.id);

    const payloadBeda = {
      kasbon_produk_id: bon,
      gudang_id: gudangId + 999,
      tgl_keluar: new Date().toISOString(),
      source_type: "SALES_KANVAS",
    };
    const resConflict = await reqCreate(bon, key, payloadBeda);
    expect(resConflict.status).toBe(409);

    const bon2 = await createNewBon();
    const key2 = `idem-conc-${runId}-${Date.now()}`;
    const requests = Array(5).fill(null).map(() => reqCreate(bon2, key2));
    const responses = await Promise.all(requests);

    responses.forEach((res) => expect([201, 409]).toContain(res.status));

    const count = await prisma.produkOut.count({
      where: { idempotency_key: key2 },
    });
    expect(count).toBe(1);

    const successful = responses.find((r) => r.status === 201);
    if (successful) createdProdukOutIds.push(successful.body.data.id);
  });

  it("3. Rollback: Gagal FEFO tidak meninggalkan Sequence & Mutasi", async () => {
    const seqBefore = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: "LDG", date_key: todayKey } },
    });
    const lastNumBefore = seqBefore?.last_number || 0;

    const bon = await createNewBon();
    await prisma.batch.update({
      where: { id: batchId },
      data: { stok_gudang: 0 },
    });

    const res = await reqCreate(bon);
    expect(res.status).toBe(400);

    const seqAfter = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: "LDG", date_key: todayKey } },
    });
    expect(seqAfter?.last_number).toBe(lastNumBefore);

    const outCount = await prisma.produkOut.count({
      where: { kasbon_produk_id: bon },
    });
    expect(outCount).toBe(0);

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(batch?.stok_gudang).toBe(0);

    await prisma.batch.update({
      where: { id: batchId },
      data: { stok_gudang: 1000 },
    });
  });

  it("4. FEFO: Batch dialokasikan berdasarkan expired_date ASC", async () => {
    const batchA = await prisma.batch.create({
      data: {
        produk_id: produkId,
        no_batch: `BATCH-A-${runId}-${Date.now()}`,
        expired_date: new Date("2027-06-01"),
        stok_gudang: 10,
      },
    });
    createdBatchIds.push(batchA.id);

    const batchB = await prisma.batch.create({
      data: {
        produk_id: produkId,
        no_batch: `BATCH-B-${runId}-${Date.now()}`,
        expired_date: new Date("2026-12-01"),
        stok_gudang: 10,
      },
    });
    createdBatchIds.push(batchB.id);

    const bon = await createNewBon(15);
    const res = await reqCreate(bon).expect(201);
    createdProdukOutIds.push(res.body.data.id);

    const details = await prisma.detailProdukOut.findMany({
      where: { produk_out_id: res.body.data.id },
      orderBy: { id: "asc" },
    });

    expect(details.length).toBe(2);
    expect(details[0].batch_id).toBe(batchB.id);
    expect(details[0].qty).toBe(10);
    expect(details[1].batch_id).toBe(batchA.id);
    expect(details[1].qty).toBe(5);
  });

  it("13. Cancel tidak mengubah nomor dokumen", async () => {
    // Self-contained: create own produk_out to guarantee a PROSES record
    const bon = await createNewBon();
    const createRes = await reqCreate(bon).expect(201);
    createdProdukOutIds.push(createRes.body.data.id);

    const outId = await prisma.produkOut.findUniqueOrThrow({
      where: { id: createRes.body.data.id },
    });
    const nomorAwal = outId.document_number;

    await request(app.getHttpServer())
      .post(`/api/transaksi/produk-out/${outId.id}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const check = await prisma.produkOut.findUnique({
      where: { id: outId.id },
    });
    expect(check?.document_number).toBe(nomorAwal);
    expect(check?.status).toBe("BATAL");
  });
});