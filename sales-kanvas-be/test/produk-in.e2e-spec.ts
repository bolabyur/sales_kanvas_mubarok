import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Produk In (Unloading) - 3 Sources & Idempotency (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: number;
  let gudangId: number;
  let produkId: number;
  let planId: number;

  const createdPlanIds: number[] = [];
  const createdAreaIds: number[] = [];
  const createdVehIds: number[] = [];
  const createdGudangIds: number[] = [];
  const createdProdukIds: number[] = [];

  const runId = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    
    prisma = app.get(PrismaService);
    const jwtService = app.get(JwtService);

    const user = await prisma.user.findUniqueOrThrow({ where: { username: 'superadmin' } });
    userId = user.id;
    token = jwtService.sign({ sub: userId, username: user.username }, { secret: process.env.JWT_SECRET || 'secret' });

    const gudang = await prisma.gudang.create({ data: { nama_gudang: `G-${runId}`, tipe_gudang: 'Utama' } });
    gudangId = gudang.id;
    createdGudangIds.push(gudang.id);

    const prod = await prisma.product.create({
      data: { name: `Prod-${runId}`, code: `P-${runId}`, barcode: `B-${runId}`, product_brand_id: 1, product_type_id: 1, sale_report_group_id: 1, supplier_id: 1, is_active: true, type_price: 'FIXED', user_id: userId, ip: '1' }
    });
    produkId = prod.id;
    createdProdukIds.push(prod.id);

    const area = await prisma.marketArea.create({ data: { name: `Area-${runId}`, user_id: userId, ip: '1' } });
    createdAreaIds.push(area.id);
    
    const veh = await prisma.vehicele.create({ data: { name: `V-${runId}`, nopol: `K${runId}`, type_vehicle: 'T', type_fuel: 'S', user_id: userId, ip: '1' } });
    createdVehIds.push(veh.id);
    
    const plan = await prisma.salesKanvasPlan.create({
      data: { invoice: `INV-${runId}`, tgl_invoice: new Date(), tgl_pergi_kanvas: new Date(), market_area_id: area.id, vehicle_id: veh.id, status: 'DISETUJUI', user_id: userId, ip: '1' }
    });
    planId = plan.id;
    createdPlanIds.push(plan.id);
  });

  afterAll(async () => {
    if (!app) return;

    // 🔥 CLEANUP ROBUST: Hapus berdasarkan ID Test
    await prisma.mutasiBatch.deleteMany({ where: { batch: { produk_id: produkId } } });
    await prisma.detailProdukIn.deleteMany({ where: { produkIn: { gudang_id: gudangId } } });
    await prisma.produkIn.deleteMany({ where: { gudang_id: gudangId } });
    await prisma.batch.deleteMany({ where: { produk_id: produkId } });
    
    if (createdPlanIds.length > 0) await prisma.salesKanvasPlan.deleteMany({ where: { id: { in: createdPlanIds } } });
    if (createdAreaIds.length > 0) await prisma.marketArea.deleteMany({ where: { id: { in: createdAreaIds } } });
    if (createdVehIds.length > 0) await prisma.vehicele.deleteMany({ where: { id: { in: createdVehIds } } });
    if (createdGudangIds.length > 0) await prisma.gudang.deleteMany({ where: { id: { in: createdGudangIds } } });
    if (createdProdukIds.length > 0) await prisma.product.deleteMany({ where: { id: { in: createdProdukIds } } });

    await app.close();
  });

  const reqCreate = (source_type: string, plan_id?: number, key?: string, batchName?: string) => {
    const payload = {
      gudang_id: gudangId,
      tgl_masuk: new Date().toISOString(),
      source_type,
      sales_kanvas_plan_id: plan_id,
      details: [{ produk_id: produkId, no_batch: batchName || `B-${runId}-${source_type}-${Date.now()}`, expired_date: '2026-12-31T00:00:00.000Z', qty_sisa: 10, kondisi: 'Bagus' }]
    };
    let req = request(app.getHttpServer()).post('/api/transaksi/produk-in').set('Authorization', `Bearer ${token}`).send(payload);
    if (key) req = req.set('x-idempotency-key', key);
    return req;
  };

  it('1. PRODUKSI: Berhasil tanpa sales_kanvas_plan_id', async () => {
    const res = await reqCreate('PRODUKSI').expect(201);
    expect(res.body.data.sales_kanvas_plan_id).toBeNull();
    expect(res.body.data.source_type).toBe('PRODUKSI');
    expect(res.body.data.document_number).toMatch(/^ULD-\d{6}-\d{3}$/);
  });

  it('2. TOKO: Berhasil tanpa sales_kanvas_plan_id', async () => {
    const res = await reqCreate('TOKO').expect(201);
    expect(res.body.data.sales_kanvas_plan_id).toBeNull();
  });

  it('3. SALES_KANVAS: Gagal jika plan_id kosong (Validasi Zod)', async () => {
    await reqCreate('SALES_KANVAS').expect(400);
  });

  it('4. SALES_KANVAS: Berhasil jika plan_id diisi', async () => {
    const res = await reqCreate('SALES_KANVAS', planId).expect(201);
    expect(res.body.data.sales_kanvas_plan_id).toBe(planId);
  });

  it('5. Idempotency: Replay tidak menambah stok 2x', async () => {
    const key = `idem-in-${runId}`;
    const batchName = `B-REPLAY-${runId}`;
    
    const payload = {
      gudang_id: gudangId,
      tgl_masuk: new Date().toISOString(),
      source_type: 'PRODUKSI',
      details: [{ produk_id: produkId, no_batch: batchName, expired_date: '2026-12-31T00:00:00.000Z', qty_sisa: 10, kondisi: 'Bagus' }]
    };

    const res1 = await request(app.getHttpServer()).post('/api/transaksi/produk-in').set('Authorization', `Bearer ${token}`).set('x-idempotency-key', key).send(payload).expect(201);
    const res2 = await request(app.getHttpServer()).post('/api/transaksi/produk-in').set('Authorization', `Bearer ${token}`).set('x-idempotency-key', key).send(payload).expect(201);
    
    expect(res1.body.data.id).toBe(res2.body.data.id);

    const batch = await prisma.batch.findUniqueOrThrow({ where: { produk_id_no_batch: { produk_id: produkId, no_batch: batchName } } });
    expect(batch.stok_gudang).toBe(10);
  });
});