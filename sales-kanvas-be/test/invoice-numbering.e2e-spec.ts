import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('TASK 08.0.4 - Invoice Numbering & Concurrency (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  
  let token: string;
  let userId: number;
  let planId: number;
  let outletId: number;
  let produkId: number;
  let batchId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // ==========================================
    // 1. GUNAKAN USER & ROLE YANG SUDAH ADA
    // ==========================================
    const existingUser = await prisma.user.findFirst({ include: { role: true } });
    if (!existingUser) throw new Error("Tidak ada User di database. Silakan buat 1 user dulu.");
    
    userId = existingUser.id;
    token = jwtService.sign(
      { sub: userId, username: existingUser.username }, 
      { secret: process.env.JWT_SECRET || 'secret' }
    );

    // 🔥 TAMBAHKAN PERMISSION KE ROLE USER TERSEBUT AGAR TIDAK 403
    const permCreate = await prisma.permission.upsert({
      where: { name: 'invoice:create' },
      update: {},
      create: { name: 'invoice:create' },
    });
    
    // Cek apakah role sudah punya permission ini, jika belum, tambahkan
    const hasPerm = await prisma.permissionRole.findFirst({
      where: { role_id: existingUser.role_id, permission_id: permCreate.id }
    });
    if (!hasPerm) {
      await prisma.permissionRole.create({
        data: { role_id: existingUser.role_id, permission_id: permCreate.id }
      });
    }

    // ==========================================
    // 2. SEEDER DATA TRANSAKSI (Outlet, Produk, Plan, Onloading)
    // ==========================================
    const runId = Date.now();
    
    // Buat Tipe Harga & Outlet
    const tipeHarga = await prisma.tipeHarga.create({ data: { nama_tipe: `TH-${runId}` } });
    const outlet = await prisma.outlet.create({ data: { nama_toko: `Toko-${runId}`, tipe_harga_id: tipeHarga.id } });
    outletId = outlet.id;

    // Buat Produk & Harga
    const produk = await prisma.product.create({
      data: { name: `Prod-${runId}`, code: `P-${runId}`, barcode: `B-${runId}`, product_brand_id: 1, product_type_id: 1, sale_report_group_id: 1, supplier_id: 1, is_active: true, type_price: 'FIXED', user_id: userId, ip: '1' }
    });
    produkId = produk.id;
    await prisma.produkHarga.create({ data: { produk_id: produk.id, tipe_harga_id: tipeHarga.id, harga: 10000 } });

    // Buat Batch & Stok
    const batch = await prisma.batch.create({ data: { produk_id: produk.id, no_batch: `BATCH-${runId}`, expired_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), stok_gudang: 100 } });
    batchId = batch.id;

    // Buat Plan
    const area = await prisma.marketArea.create({ data: { name: `Area-${runId}`, user_id: 1, ip: '1' } });
    const veh = await prisma.vehicele.create({ data: { name: `Veh-${runId}`, nopol: `K${runId}`, type_vehicle: 'Truk', type_fuel: 'Solar', user_id: 1, ip: '1' } });
    const plan = await prisma.salesKanvasPlan.create({
      data: { invoice: `INV-${runId}`, tgl_invoice: new Date(), tgl_pergi_kanvas: new Date(), market_area_id: area.id, vehicle_id: veh.id, status: 'DISETUJUI', user_id: userId, ip: '1' }
    });
    planId = plan.id;

    // Buat Onloading (Kasbon Produk & Produk Out) agar Invoice bisa dibuat
    const kasbon = await prisma.kasbonProduk.create({
      data: { sales_kanvas_plan_id: plan.id, status: 'ONLOADING', user_id: userId, ip: '1' }
    });
    const gudang = await prisma.gudang.create({ data: { nama_gudang: `G-${runId}`, tipe_gudang: 'Barang Jadi' } });
    const produkOut = await prisma.produkOut.create({
      data: { kasbon_produk_id: kasbon.id, gudang_id: gudang.id, tgl_keluar: new Date(), status: 'SELESAI', user_id: userId, ip: '1' }
    });
    await prisma.detailProdukOut.create({
      data: { produk_out_id: produkOut.id, batch_id: batch.id, produk_id: produk.id, qty: 100 }
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const reqCreateInvoice = () => {
    return request(app.getHttpServer())
      .post('/api/transaksi/invoice')
      .set('Authorization', `Bearer ${token}`)
      .send({
        outlet_id: outletId,
        sales_kanvas_plan_id: planId,
        tipe_pembayaran: 'Tunai',
        tgl_invoice: new Date().toISOString(),
        details: [{ produk_id: produkId, qty: 1 }]
      });
  };

  it('1. Concurrency: 10 Create Invoice bersamaan, tidak ada nomor duplikat', async () => {
    const requests = Array(10).fill(null).map(() => reqCreateInvoice());
    const responses = await Promise.all(requests);

    // Pastikan semua berhasil (201)
    responses.forEach(res => {
      if (res.status !== 201) console.log(res.body);
      expect(res.status).toBe(201);
    });

    // Ambil semua document_number
    const docNumbers = responses.map(r => r.body.data.document_number);
    
    // Pastikan tidak ada yang null
    docNumbers.forEach(doc => expect(doc).toMatch(/^INV-\d{6}-\d{3}$/));

    // Pastikan 10 nomor unik (tidak ada duplikat)
    const uniqueNumbers = new Set(docNumbers);
    expect(uniqueNumbers.size).toBe(10);
    
    console.log("🔥 10 Nomor Invoice yang dihasilkan:", docNumbers.sort());
  });
});