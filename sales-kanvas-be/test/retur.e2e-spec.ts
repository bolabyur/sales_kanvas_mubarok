import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('TASK 05 - Retur & Plan Terminal (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  
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
    jwtService = app.get(JwtService);

    // ==========================================
    // SEEDER UNTUK TEST RETUR
    // ==========================================
    
    // 1. Buat Permission & Role
    const pCreate = await prisma.permission.upsert({ where: { name: 'retur:create' }, update: {}, create: { name: 'retur:create' } });
    const pReceive = await prisma.permission.upsert({ where: { name: 'retur:receive' }, update: {}, create: { name: 'retur:receive' } });
    
    // 🔥 TAMBAHKAN PERMISSION PLAN
    const pUpdatePlan = await prisma.permission.upsert({ 
      where: { name: 'plan:update' }, // Sesuaikan dengan @RequirePermission di PlanController Anda (misal: plan:update-status)
      update: {}, 
      create: { name: 'plan:update' } 
    });
    
    const roleSales = await prisma.role.create({ data: { name: `SalesRetur-${runId}` } });
    const roleGudang = await prisma.role.create({ data: { name: `GudangRetur-${runId}` } });
    
    await prisma.permissionRole.createMany({
      data: [
        { permission_id: pCreate.id, role_id: roleSales.id },
        { permission_id: pReceive.id, role_id: roleGudang.id },
        { permission_id: pUpdatePlan.id, role_id: roleSales.id } // 🔥 BERIKAN IZIN KE SALES
      ]
    });

    // 2. Buat Employee & User (Sales & Gudang)
    const empSales = await prisma.employee.create({
      data: { name: 'Emp Sales', nip: `NIP-S-${runId}`, gender: 'MALE', agama: 'Islam', tgl_lahir: new Date(), tgl_masuk: new Date(), employee_position_id: 1, employee_job_id: 1, employee_contract_id: 1, devisi_id: 1, user_id: 1, ip: '127.0.0.1' }
    });
    const empGudang = await prisma.employee.create({
      data: { name: 'Emp Gudang', nip: `NIP-G-${runId}`, gender: 'MALE', agama: 'Islam', tgl_lahir: new Date(), tgl_masuk: new Date(), employee_position_id: 1, employee_job_id: 1, employee_contract_id: 1, devisi_id: 1, user_id: 1, ip: '127.0.0.1' }
    });

    const userSales = await prisma.user.create({ data: { username: `sales_r_${runId}`, password: 'x', name: 'Sales', karyawan_id: empSales.id, role_id: roleSales.id } });
    const userGudang = await prisma.user.create({ data: { username: `gudang_r_${runId}`, password: 'x', name: 'Gudang', karyawan_id: empGudang.id, role_id: roleGudang.id } });

    tokenSales = jwtService.sign({ sub: userSales.id, username: userSales.username }, { secret: process.env.JWT_SECRET || 'secret' });
    tokenGudang = jwtService.sign({ sub: userGudang.id, username: userGudang.username }, { secret: process.env.JWT_SECRET || 'secret' });

    // 3. Buat Master (Area, Vehicle, Gudang, Produk)
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

    // Buat Batch dengan Stok Awal 0
    const batch = await prisma.batch.create({
      data: { produk_id: prod.id, no_batch: `BATCH-${runId}`, expired_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), stok_gudang: 0 }
    });
    batchId = batch.id;

    // Simpan gudang ID untuk test
    (global as any).gudangId = gudang.id;
  });

  afterAll(async () => {
    await app.close();
  });

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
    
    // Pastikan Stok Tetap 0
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(batch?.stok_gudang).toBe(0); 
  });

  it('2. Penerimaan Parsial (5 dari 10) & Idempotency Retry', async () => {
    const returId = (await prisma.kanvasReturn.findFirst({ where: { sales_kanvas_plan_id: planId } }))!.id;
    const detailId = (await prisma.kanvasReturnDetail.findFirst({ where: { kanvas_return_id: returId } }))!.id;
    const key = `idem-recv-${runId}`;

    const payload = { details: [{ detail_id: detailId, qty_diterima: 5, kondisi: 'BAGUS' }] };
    
    // Kirim Pertama
    await request(app.getHttpServer())
      .post(`/api/transaksi/kanvas-return/${returId}/receive`)
      .set('Authorization', `Bearer ${tokenGudang}`)
      .set('x-idempotency-key', key)
      .send(payload)
      .expect(201);
    
    let batch = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(batch?.stok_gudang).toBe(5); // Stok bertambah 5

    // Kirim Kedua (Retry)
    await request(app.getHttpServer())
      .post(`/api/transaksi/kanvas-return/${returId}/receive`)
      .set('Authorization', `Bearer ${tokenGudang}`)
      .set('x-idempotency-key', key)
      .send(payload)
      .expect(201);
    
    batch = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(batch?.stok_gudang).toBe(5); // 🔥 HARUS TETAP 5 (Tidak dobel)

    const detail = await prisma.kanvasReturnDetail.findUnique({ where: { id: detailId } });
    expect(detail?.qty_diterima).toBe(5); // Sisa 5 belum diterima
  });

  it('3. Barang RUSAK tidak masuk stok & Penerimaan Sisa', async () => {
    const returId = (await prisma.kanvasReturn.findFirst({ where: { sales_kanvas_plan_id: planId } }))!.id;
    const detailId = (await prisma.kanvasReturnDetail.findFirst({ where: { kanvas_return_id: returId } }))!.id;
    
    // Terima sisa 5 dengan kondisi RUSAK
    await request(app.getHttpServer())
      .post(`/api/transaksi/kanvas-return/${returId}/receive`)
      .set('Authorization', `Bearer ${tokenGudang}`)
      .send({ details: [{ detail_id: detailId, qty_diterima: 5, kondisi: 'RUSAK' }] })
      .expect(201);
    
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(batch?.stok_gudang).toBe(5); // 🔥 TETAP 5 (Barang rusak tidak menambah stok)
    
    // Cek status retur menjadi DITERIMA (karena total 10 sudah diterima)
    const retur = await prisma.kanvasReturn.findUnique({ where: { id: returId } });
    expect(retur?.status).toBe('DITERIMA'); 
  });

  it('4. Plan BATAL tidak bisa diubah statusnya lagi', async () => {
    // 1. Ubah ke BATAL secara manual via DB (untuk setup test)
    await prisma.salesKanvasPlan.update({ where: { id: planId }, data: { status: 'BATAL' } });

    // 2. Coba ubah ke status lain via API
    await request(app.getHttpServer())
      .patch(`/api/plan/${planId}/update-status`)
      .set('Authorization', `Bearer ${tokenSales}`) 
      .send({ status: 'DIAJUKAN' })
      .expect(400); // 🔥 Harus Bad Request (ditolak karena terminal state)
  });
});