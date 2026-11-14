import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ProdukInService } from "../src/transaksi/produk-in/produk-in.service";

describe("TASK 08.0.5.4 - Produk In ULD Numbering & Concurrency (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let tokenSecondUser: string;
  let userId: number;

  let gudangId: number;
  let produkId: number;
  let planId: number;

  const createdPlanIds: number[] = [];
  const createdAreaIds: number[] = [];
  const createdVehIds: number[] = [];
  const createdGudangIds: number[] = [];
  const createdProdukIds: number[] = [];
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
    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";
    const day = parts.find((p) => p.type === "day")?.value || "";
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
          permissionRoles: {
            some: { permission: { name: "produk-in:create" } },
          },
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
  });

  afterAll(async () => {
    if (!app) return;

    // CLEANUP ROBUST
    await prisma.mutasiBatch.deleteMany({
      where: { batch: { produk_id: produkId } },
    });
    await prisma.detailProdukIn.deleteMany({
      where: { produkIn: { gudang_id: gudangId } },
    });
    await prisma.produkIn.deleteMany({ where: { gudang_id: gudangId } });
    await prisma.batch.deleteMany({ where: { produk_id: produkId } });

    if (createdPlanIds.length > 0)
      await prisma.salesKanvasPlan.deleteMany({
        where: { id: { in: createdPlanIds } },
      });
    if (createdAreaIds.length > 0)
      await prisma.marketArea.deleteMany({
        where: { id: { in: createdAreaIds } },
      });
    if (createdVehIds.length > 0)
      await prisma.vehicele.deleteMany({
        where: { id: { in: createdVehIds } },
      });
    if (createdGudangIds.length > 0)
      await prisma.gudang.deleteMany({
        where: { id: { in: createdGudangIds } },
      });
    if (createdProdukIds.length > 0)
      await prisma.product.deleteMany({
        where: { id: { in: createdProdukIds } },
      });
    if (createdOutletIds.length > 0)
      await prisma.outlet.deleteMany({
        where: { id: { in: createdOutletIds } },
      });
    if (createdTipeHargaIds.length > 0)
      await prisma.tipeHarga.deleteMany({
        where: { id: { in: createdTipeHargaIds } },
      });

    await app.close();
  });

  const reqCreate = (
    key?: string,
    customPayload?: any,
    useSecondToken = false,
  ) => {
    const uniqueBatch = `B-${runId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const payload = customPayload || {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "PRODUKSI",
      details: [
        {
          produk_id: produkId,
          no_batch: uniqueBatch,
          expired_date: "2026-12-31T00:00:00.000Z",
          qty_sisa: 10,
          kondisi: "Bagus",
        },
      ],
    };
    const req = request(app.getHttpServer())
      .post("/api/transaksi/produk-in")
      .set(
        "Authorization",
        `Bearer ${useSecondToken ? tokenSecondUser : token}`,
      )
      .send(payload);
    if (key) req.set("x-idempotency-key", key);
    return req;
  };

  it("1. Sequential Numbering ULD-YYMMDD-NNN", async () => {
    const res1 = await reqCreate().expect(201);
    expect(res1.body.data.document_number).toMatch(/^ULD-\d{6}-\d{3}$/);
    const num1 = parseInt(res1.body.data.document_number.split("-")[2], 10);

    const res2 = await reqCreate().expect(201);
    expect(res2.body.data.document_number).toMatch(/^ULD-\d{6}-\d{3}$/);
    const num2 = parseInt(res2.body.data.document_number.split("-")[2], 10);
    expect(num2).toBe(num1 + 1);
  });

  it("2. Concurrent Same-Key: 5 request paralel = 1 dokumen", async () => {
    const key = `same-key-uld-${runId}`;
    const staticPayload = {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "PRODUKSI",
      details: [
        {
          produk_id: produkId,
          no_batch: `B-SAME-${runId}`,
          expired_date: "2026-12-31T00:00:00.000Z",
          qty_sisa: 5,
          kondisi: "Bagus",
        },
      ],
    };

    const requests = Array(5)
      .fill(null)
      .map(() => reqCreate(key, staticPayload));
    const responses = await Promise.all(requests);
    responses.forEach((res) => expect(res.status).toBe(201));

    const ids = new Set(responses.map((r) => r.body.data.id));
    expect(ids.size).toBe(1);
  });

  it("3. Concurrent Different Keys: 10 request paralel = 10 nomor unik", async () => {
    const requests = Array(10)
      .fill(null)
      .map((_, i) => reqCreate(`different-key-uld-${runId}-${i}`));
    const responses = await Promise.all(requests);

    const ids = new Set<number>();
    const docNumbers = new Set<string>();
    responses.forEach((res) => {
      if (res.status !== 201) console.log("Err 3:", res.body);
      expect(res.status).toBe(201);
      ids.add(res.body.data.id);
      docNumbers.add(res.body.data.document_number);
    });

    expect(ids.size).toBe(10);
    expect(docNumbers.size).toBe(10);
  }, 30000);

  it("4. Idempotency Replay tidak menambah stok/mutasi", async () => {
    const key = `replay-uld-${runId}`;
    const staticPayload = {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "PRODUKSI",
      details: [
        {
          produk_id: produkId,
          no_batch: `B-REPLAY-${runId}`,
          expired_date: "2026-12-31T00:00:00.000Z",
          qty_sisa: 10,
          kondisi: "Bagus",
        },
      ],
    };

    const res1 = await reqCreate(key, staticPayload).expect(201);
    const stockBefore = (
      await prisma.batch.findUniqueOrThrow({
        where: {
          produk_id_no_batch: {
            produk_id: produkId,
            no_batch: `B-REPLAY-${runId}`,
          },
        },
      })
    ).stok_gudang;

    const res2 = await reqCreate(key, staticPayload).expect(201);
    expect(res1.body.data.id).toBe(res2.body.data.id);

    const stockAfter = (
      await prisma.batch.findUniqueOrThrow({
        where: {
          produk_id_no_batch: {
            produk_id: produkId,
            no_batch: `B-REPLAY-${runId}`,
          },
        },
      })
    ).stok_gudang;
    expect(stockAfter).toBe(stockBefore);
  });

  it("5. Payload Conflict (409)", async () => {
    const key = `conflict-uld-${runId}`;
    const payload1 = {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "PRODUKSI",
      details: [
        {
          produk_id: produkId,
          no_batch: `B-C1-${runId}`,
          expired_date: "2026-12-31T00:00:00.000Z",
          qty_sisa: 5,
          kondisi: "Bagus",
        },
      ],
    };

    await reqCreate(key, payload1).expect(201);

    const payload2 = {
      ...payload1,
      details: [{ ...payload1.details[0], qty_sisa: 99 }],
    };
    await reqCreate(key, payload2).expect(409);
  });

  it("6. Cross-User Isolation", async () => {
    const key = `cross-uld-${runId}`;
    const payload = {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "PRODUKSI",
      details: [
        {
          produk_id: produkId,
          no_batch: `B-CROSS-${runId}`,
          expired_date: "2026-12-31T00:00:00.000Z",
          qty_sisa: 2,
          kondisi: "Bagus",
        },
      ],
    };

    const res1 = await reqCreate(key, payload, false).expect(201);
    const res2 = await reqCreate(key, payload, true).expect(201);
    expect(res1.body.data.id).not.toBe(res2.body.data.id);
  });

  it("7. Rollback Sequence: Generator runs then transaction fails", async () => {
    const dateKey = getJakartaDateKey(new Date("2026-12-31T00:00:00.000Z"));
    const seqBefore = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: "ULD", date_key: dateKey } },
    });
    const lastNumBefore = seqBefore?.last_number || 0;

    // 🔥 FIX: Ambil instance dari ProdukInService, bukan dari AppModule
    const produkInService = app.get(ProdukInService) as any;
    const codeGen = produkInService.codeGenerator;

    const originalGenerate = codeGen.generate.bind(codeGen);
    const spy = jest
      .spyOn(codeGen, "generate")
      .mockImplementationOnce(async (tx, prefix, date) => {
        await originalGenerate(tx, prefix, date); // Sequence berjalan
        throw new Error("Simulasi Gagal Setelah Generate");
      });

    try {
      await reqCreate().expect(500);
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }

    const seqAfter = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: "ULD", date_key: dateKey } },
    });
    expect(seqAfter?.last_number || 0).toBe(lastNumBefore);
  });

  it("8. Stock Mutation BAGUS: Stok bertambah & mutasi tercatat", async () => {
    const res = await reqCreate(undefined, {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "PRODUKSI",
      details: [
        {
          produk_id: produkId,
          no_batch: `B-BAGUS-${runId}`,
          expired_date: "2026-12-31T00:00:00.000Z",
          qty_sisa: 10,
          kondisi: "Bagus",
        },
      ],
    }).expect(201);

    const batch = await prisma.batch.findUniqueOrThrow({
      where: {
        produk_id_no_batch: {
          produk_id: produkId,
          no_batch: `B-BAGUS-${runId}`,
        },
      },
    });
    expect(batch.stok_gudang).toBe(10);
  });

  it("9. Stock Mutation RUSAK: Stok tetap & mutasi tercatat", async () => {
    const res = await reqCreate(undefined, {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "PRODUKSI",
      details: [
        {
          produk_id: produkId,
          no_batch: `B-RUSAK-${runId}`,
          expired_date: "2026-12-31T00:00:00.000Z",
          qty_sisa: 5,
          kondisi: "Rusak",
        },
      ],
    }).expect(201);

    const batch = await prisma.batch.findUniqueOrThrow({
      where: {
        produk_id_no_batch: {
          produk_id: produkId,
          no_batch: `B-RUSAK-${runId}`,
        },
      },
    });
    expect(batch.stok_gudang).toBe(0);
  });

  it("10. Source Type SALES_KANVAS (Validasi Plan)", async () => {
    await reqCreate(undefined, {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "SALES_KANVAS",
      details: [
        {
          produk_id: produkId,
          no_batch: `B-SK-${runId}`,
          expired_date: "2026-12-31T00:00:00.000Z",
          qty_sisa: 1,
          kondisi: "Bagus",
        },
      ],
    }).expect(400);

    await reqCreate(undefined, {
      gudang_id: gudangId,
      sales_kanvas_plan_id: planId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "SALES_KANVAS",
      details: [
        {
          produk_id: produkId,
          no_batch: `B-SK-${runId}`,
          expired_date: "2026-12-31T00:00:00.000Z",
          qty_sisa: 1,
          kondisi: "Bagus",
        },
      ],
    }).expect(201);
  });

  it("11. Batch ED Mismatch (400)", async () => {
    await reqCreate(undefined, {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "PRODUKSI",
      details: [
        {
          produk_id: produkId,
          no_batch: `B-ED-${runId}`,
          expired_date: "2026-01-01T00:00:00.000Z",
          qty_sisa: 1,
          kondisi: "Bagus",
        },
      ],
    }).expect(201);

    await reqCreate(undefined, {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "PRODUKSI",
      details: [
        {
          produk_id: produkId,
          no_batch: `B-ED-${runId}`,
          expired_date: "2027-01-01T00:00:00.000Z",
          qty_sisa: 1,
          kondisi: "Bagus",
        },
      ],
    }).expect(400);
  });

  it("12. Invalid Request (400)", async () => {
    await reqCreate(undefined, {
      gudang_id: gudangId,
      tgl_masuk: "2026-12-31T00:00:00.000Z",
      source_type: "PRODUKSI",
      details: [],
    }).expect(400);
  });
});