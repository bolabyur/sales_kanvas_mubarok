import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Invoice - Product Active/Inactive Logic (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: number;
  let outletId: number;
  let planId: number;
  let produkId: number;
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

    const tipeHarga = await prisma.tipeHarga.create({ data: { nama_tipe: `TH-${runId}` } });
    const outlet = await prisma.outlet.create({ data: { nama_toko: `Toko-${runId}`, tipe_harga_id: tipeHarga.id } });
    outletId = outlet.id;

    const produk = await prisma.product.create({
      data: { name: `Prod-${runId}`, code: `P-${runId}`, barcode: `B-${runId}`, product_brand_id: 1, product_type_id: 1, sale_report_group_id: 1, supplier_id: 1, is_active: true, type_price: 'FIXED', user_id: userId, ip: '1' }
    });
    produkId = produk.id;
    await prisma.produkHarga.create({ data: { produk_id: produkId, tipe_harga_id: tipeHarga.id, harga: 10000 } });

    const batch = await prisma.batch.create({ data: { produk_id: produkId, no_batch: `BATCH-${runId}`, expired_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), stok_gudang: 100 } });

    const area = await prisma.marketArea.create({ data: { name: `Area-${runId}`, user_id: 1, ip: '1' } });
    const veh = await prisma.vehicele.create({ data: { name: `Veh-${runId}`, nopol: `K${runId}`, type_vehicle: 'Truk', type_fuel: 'Solar', user_id: 1, ip: '1' } });
    const plan = await prisma.salesKanvasPlan.create({
      data: { invoice: `INV-${runId}`, tgl_invoice: new Date(), tgl_pergi_kanvas: new Date(), market_area_id: area.id, vehicle_id: veh.id, status: 'DISETUJUI', user_id: userId, ip: '1' }
    });
    planId = plan.id;

    const kasbon = await prisma.kasbonProduk.create({
      data: { sales_kanvas_plan_id: plan.id, status: 'ONLOADING', user_id: userId, ip: '1' }
    });
    const gudang = await prisma.gudang.create({ data: { nama_gudang: `G-${runId}`, tipe_gudang: 'Barang Jadi' } });
    const produkOut = await prisma.produkOut.create({
      data: { kasbon_produk_id: kasbon.id, gudang_id: gudang.id, tgl_keluar: new Date(), status: 'SELESAI', user_id: userId, ip: '1' }
    });
    await prisma.detailProdukOut.create({
      data: { produk_out_id: produkOut.id, batch_id: batch.id, produk_id: produkId, qty: 10 }
    });
  });

  afterAll(async () => { if (app) await app.close(); });

  const reqCreateInvoice = (qty: number, produkIdOverride?: number) => {
    return request(app.getHttpServer())
      .post('/api/transaksi/invoice')
      .set('Authorization', `Bearer ${token}`)
      .send({
        outlet_id: outletId,
        sales_kanvas_plan_id: planId,
        tipe_pembayaran: 'Tunai',
        tgl_invoice: new Date().toISOString(),
        details: [{ produk_id: produkIdOverride || produkId, qty }]
      });
  };

  it('1. Produk Aktif: Berhasil di-Invoice', async () => {
    const res = await reqCreateInvoice(2);
    if (res.status !== 201) console.log("Error 1:", res.body);
    expect(res.status).toBe(201);
  });

  it('2. Produk Nonaktif: Tetap berhasil di-Invoice (Sesuai Revisi)', async () => {
    await prisma.product.update({ where: { id: produkId }, data: { is_active: false } });
    
    const res = await reqCreateInvoice(3);
    if (res.status !== 201) console.log("Error 2 Body:", res.body); // 🔥 LOG UNTUK DEBUG
    expect(res.status).toBe(201);
    
    await prisma.product.update({ where: { id: produkId }, data: { is_active: true } });
  });

  it('3. Produk Tidak Ditemukan: Harus ditolak (404)', async () => {
    await reqCreateInvoice(1, 9999999).expect(404);
  });

  it('4. Melebihi Sisa Loading: Harus ditolak (400)', async () => {
    await reqCreateInvoice(6).expect(400);
  });
});