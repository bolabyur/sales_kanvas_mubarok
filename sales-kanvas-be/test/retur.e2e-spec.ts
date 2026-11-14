import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('TASK 05 - Retur & Plan Terminal (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenSales: string;
  let tokenGudang: string;
  let planId: number;
  let batchId: number;
  let produkId: number;
  const runId = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api'); 
    await app.init();
    
    prisma = app.get(PrismaService);
    const jwtService = app.get(JwtService);

    // GUNAKAN USER DARI SEED
    const userSales = await prisma.user.findUniqueOrThrow({ where: { username: 'sales' } });
    const userGudang = await prisma.user.findUniqueOrThrow({ where: { username: 'gudang' } });

    tokenSales = jwtService.sign({ sub: userSales.id, username: userSales.username }, { secret: process.env.JWT_SECRET || 'secret' });
    tokenGudang = jwtService.sign({ sub: userGudang.id, username: userGudang.username }, { secret: process.env.JWT_SECRET || 'secret' });

    const area = await prisma.marketArea.create({ data: { name: `Area-${runId}`, user_id: 1, ip: '1' } });
    const veh = await prisma.vehicele.create({ data: { name: `Veh-${runId}`, nopol: `K${runId}`, type_vehicle: 'Truk', type_fuel: 'Solar', user_id: 1, ip: '1' } });
    const gudang = await prisma.gudang.create({ data: { nama_gudang: `Gudang-${runId}`, tipe_gudang: 'Barang Jadi' } });
    
    const plan = await prisma.salesKanvasPlan.create({
      data: { invoice: `INV-${runId}`, tgl_invoice: new Date(), tgl_pergi_kanvas: new Date(), market_area_id: area.id, vehicle_id: veh.id, status: 'DISETUJUI', user_id: userSales.id, ip: '1' }
    });
    planId = plan.id;

    const prod = await prisma.product.create({
      data: { name: `Prod-${runId}`, code: `P-${runId}`, barcode: `B-${runId}`, product_brand_id: 1, product_type_id: 1, sale_report_group_id: 1, supplier_id: 1, is_active: true, type_price: 'FIXED', user_id: 1, ip: '1' }
    });
    produkId = prod.id;

    const batch = await prisma.batch.create({
      data: { produk_id: prod.id, no_batch: `BATCH-${runId}`, expired_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), stok_gudang: 0 }
    });
    batchId = batch.id;
    (global as any).gudangId = gudang.id;
  });

  afterAll(async () => { if (app) await app.close(); });

  it('1. Retur Sales: Stok gudang TIDAK bertambah', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/transaksi/kanvas-return')
      .set('Authorization', `Bearer ${tokenSales}`)
      .send({
        sales_kanvas_plan_id: planId,
        gudang_tujuan_id: (global as any).gudangId,
        tgl_retur: new Date().toISOString(),
        details: [{ batch_id: batchId, produk_id: produkId, qty: 10, kondisi: 'BAGUS' }]
      })
      .expect(201);

    expect(res.body.data.status).toBe('MENUNGGU_GUDANG');
    
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(batch?.stok_gudang).toBe(0); 
  });

  it('2. Penerimaan Parsial (5 dari 10) & Idempotency Retry', async () => {
    const returId = (await prisma.kanvasReturn.findFirst({ where: { sales_kanvas_plan_id: planId } }))!.id;
    const detailId = (await prisma.kanvasReturnDetail.findFirst({ where: { kanvas_return_id: returId } }))!.id;
    const key = `idem-recv-${runId}`;

    const payload = { details: [{ detail_id: detailId, qty_diterima: 5, kondisi: 'BAGUS' }] };
    
    await request(app.getHttpServer())
      .post(`/api/transaksi/kanvas-return/${returId}/receive`)
      .set('Authorization', `Bearer ${tokenGudang}`)
      .set('x-idempotency-key', key)
      .send(payload)
      .expect(201);
    
    let batch = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(batch?.stok_gudang).toBe(5);

    await request(app.getHttpServer())
      .post(`/api/transaksi/kanvas-return/${returId}/receive`)
      .set('Authorization', `Bearer ${tokenGudang}`)
      .set('x-idempotency-key', key)
      .send(payload)
      .expect(201);
    
    batch = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(batch?.stok_gudang).toBe(5);

    const detail = await prisma.kanvasReturnDetail.findUnique({ where: { id: detailId } });
    expect(detail?.qty_diterima).toBe(5); 
  });

  it('3. Barang RUSAK tidak masuk stok & Penerimaan Sisa', async () => {
    const returId = (await prisma.kanvasReturn.findFirst({ where: { sales_kanvas_plan_id: planId } }))!.id;
    const detailId = (await prisma.kanvasReturnDetail.findFirst({ where: { kanvas_return_id: returId } }))!.id;
    
    await request(app.getHttpServer())
      .post(`/api/transaksi/kanvas-return/${returId}/receive`)
      .set('Authorization', `Bearer ${tokenGudang}`)
      .send({ details: [{ detail_id: detailId, qty_diterima: 5, kondisi: 'RUSAK' }] })
      .expect(201);
    
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(batch?.stok_gudang).toBe(5); 
    
    const retur = await prisma.kanvasReturn.findUnique({ where: { id: returId } });
    expect(retur?.status).toBe('DITERIMA'); 
  });

  it('4. Plan BATAL tidak bisa diubah statusnya lagi', async () => {
    await prisma.salesKanvasPlan.update({ where: { id: planId }, data: { status: 'BATAL' } });

    await request(app.getHttpServer())
      .patch(`/api/plan/${planId}/update-status`)
      .set('Authorization', `Bearer ${tokenSales}`) 
      .send({ status: 'DIAJUKAN' })
      .expect(400); 
  });
});