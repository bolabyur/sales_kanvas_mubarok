import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("Business-Level Idempotency (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let tokenUserA!: string;
  let userIdA!: number;
  let validProductId!: number;
  const runId = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // Bersihkan cache
    await prisma.idempotencyRecord.deleteMany();

    const permCreate = await prisma.permission.upsert({
      where: { name: "kasbon-produk:create" },
      update: {},
      create: { name: "kasbon-produk:create" },
    });

    const role = await prisma.role.create({
      data: {
        name: `Sales-${runId}`,
        permissionRoles: { create: [{ permission_id: permCreate.id }] },
      },
    });

    const employee = await prisma.employee.create({
      data: {
        name: "Test Sales",
        nip: `NIP${runId}`,
        gender: "MALE",
        agama: "Islam",
        tgl_lahir: new Date(),
        tgl_masuk: new Date(),
        employee_position_id: 1,
        employee_job_id: 1,
        employee_contract_id: 1,
        devisi_id: 1,
        user_id: 1,
        ip: "127.0.0.1",
      },
    });

    const user = await prisma.user.create({
      data: {
        username: `sales${runId}`,
        password: "rahasia",
        name: "Test Sales",
        karyawan_id: employee.id,
        role_id: role.id,
      },
    });
    userIdA = user.id;

    const product = await prisma.product.create({
      data: {
        name: `Produk ${runId}`,
        code: `P${runId}`,
        barcode: `B${runId}`,
        product_brand_id: 1,
        product_type_id: 1,
        sale_report_group_id: 1,
        supplier_id: 1,
        is_active: true,
        type_price: "FIXED",
        user_id: 1,
        ip: "127.0.0.1",
      },
    });
    validProductId = product.id;

    await prisma.batch.create({
      data: {
        produk_id: product.id,
        no_batch: `BATCH-${runId}`,
        expired_date: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ),
        stok_gudang: 1000,
      },
    });

    tokenUserA = jwtService.sign(
      { sub: user.id, username: user.username },
      { secret: process.env.JWT_SECRET || "secret" },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const generateNewPlan = async () => {
    const area = await prisma.marketArea.create({
      data: { name: `Area ${Date.now()}`, user_id: 1, ip: "127.0.0.1" },
    });
    const vehicle = await prisma.vehicele.create({
      data: {
        name: `Truk ${Date.now()}`,
        nopol: `K${Date.now()}`,
        type_vehicle: "Truk",
        type_fuel: "Solar",
        user_id: 1,
        ip: "127.0.0.1",
      },
    });
    const plan = await prisma.salesKanvasPlan.create({
      data: {
        invoice: `INV-${Date.now()}`,
        tgl_invoice: new Date(),
        tgl_pergi_kanvas: new Date(),
        market_area_id: area.id,
        vehicle_id: vehicle.id,
        status: "DISETUJUI",
        user_id: userIdA,
        ip: "127.0.0.1",
      },
    });
    return plan.id;
  };

  const reqCreateBon = (
    token: string,
    key: string,
    planId: number,
    qtyOverride?: number,
  ) => {
    return request(app.getHttpServer())
      .post("/api/transaksi/kasbon-produk")
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send({
        sales_kanvas_plan_id: planId,
        details: [{ produk_id: validProductId, qty_bawa: qtyOverride || 2 }],
      });
  };

  it("1. Sequential Duplicate: Hanya 1 data tersimpan", async () => {
    const key = `test-seq-1-${runId}`;
    const planId = await generateNewPlan();

    const res1 = await reqCreateBon(tokenUserA, key, planId).expect(201);
    const res2 = await reqCreateBon(tokenUserA, key, planId).expect(201);

    expect(res1.body.data.id).toEqual(res2.body.data.id);
    const count = await prisma.kasbonProduk.count({
      where: { idempotency_key: key },
    });
    expect(count).toEqual(1);
  });

  it("2. Concurrent Duplicate: 5 request bersamaan, 1 data", async () => {
    const key = `test-conc-1-${runId}`;
    const planId = await generateNewPlan();

    const requests = Array(5)
      .fill(null)
      .map(() => reqCreateBon(tokenUserA, key, planId));
    const responses = await Promise.all(requests);

    responses.forEach((res: any) => expect([201, 409]).toContain(res.status));

    const count = await prisma.kasbonProduk.count({
      where: { idempotency_key: key },
    });
    expect(count).toEqual(1);
  });

  it("3. Payload Mismatch: 409 Conflict", async () => {
    const key = `test-mismatch-1-${runId}`;
    const planId = await generateNewPlan();

    await reqCreateBon(tokenUserA, key, planId, 2).expect(201);
    await reqCreateBon(tokenUserA, key, planId, 99).expect(409);
  });

  it("4. Transaction Rollback: Gagal bisnis -> bersih -> bisa diretry", async () => {
    const key = `test-rollback-1-${runId}`;
    const planId = await generateNewPlan();

    await reqCreateBon(tokenUserA, key, 999999999, 2).expect(404);

    const count = await prisma.kasbonProduk.count({
      where: { idempotency_key: key },
    });
    expect(count).toEqual(0);

    await reqCreateBon(tokenUserA, key, planId, 2).expect(201);
  });

  // 🔥 TAMBAHKAN TEST 5 DI SINI
  it("5. Ownership Isolation: User B tidak bisa replay key milik User A", async () => {
    const key = `test-owner-${runId}`;
    const planId = await generateNewPlan();

    // 1. User A membuat BON
    await reqCreateBon(tokenUserA, key, planId).expect(201);

    // 2. Buat User B dan Berikan Permission yang SAMA
    const permCreate = await prisma.permission.findUnique({
      where: { name: "kasbon-produk:create" },
    });
    const roleB = await prisma.role.create({
      data: {
        name: `SalesB-${runId}`,
        permissionRoles: { create: [{ permission_id: permCreate!.id }] }, // 🔥 BERIKAN PERMISSION
      },
    });

    const empB = await prisma.employee.create({
      data: {
        name: "Test Emp B",
        nip: `NIPB${runId}`,
        gender: "MALE",
        agama: "Islam",
        tgl_lahir: new Date(),
        tgl_masuk: new Date(),
        employee_position_id: 1,
        employee_job_id: 1,
        employee_contract_id: 1,
        devisi_id: 1,
        user_id: 1,
        ip: "127.0.0.1",
      },
    });
    const userB = await prisma.user.create({
      data: {
        username: `salesB${runId}`,
        password: "rahasia",
        name: "Test Sales B",
        karyawan_id: empB.id,
        role_id: roleB.id,
      },
    });

    // Generate token untuk User B
    const tokenUserB = jwtService.sign(
      { sub: userB.id, username: userB.username },
      { secret: process.env.JWT_SECRET || "secret" },
    );

    // 3. User B mencoba request dengan Key yang SAMA
    // Harus GAGAL (404) karena Service akan mendeteksi data milik User A
    await reqCreateBon(tokenUserB, key, planId).expect(404);
  });
});
