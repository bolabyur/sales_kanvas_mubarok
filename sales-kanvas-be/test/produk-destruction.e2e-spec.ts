import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('TASK 08.0.5.5a & 5.5b - DSP Stock, Permission & Idempotency (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenA: string;
  let tokenB: string;
  let tokenNoPerm: string;
  let tokenNoRead: string;
  let userIdA: number;

  let gudangId: number;
  let produkId: number;
  let batchId: number;

  let tempPermId: number;
  let tempRoleId: number;
  let permissionWasAlreadyAssigned = false;

  const createdGudangIds: number[] = [];
  const createdProdukIds: number[] = [];
  const createdBatchIds: number[] = [];

  const runId = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get(PrismaService);
    const jwtService = app.get(JwtService);

    // 1. User Superadmin
    const userA = await prisma.user.findUniqueOrThrow({ where: { username: 'superadmin' } });
    userIdA = userA.id;
    tokenA = jwtService.sign({ sub: userIdA, username: userA.username }, { secret: process.env.JWT_SECRET || 'secret' });

    // 2. User Sales + Permission Sementara (dengan tracking)
    const salesUser = await prisma.user.findUniqueOrThrow({ where: { username: 'sales' } });
    const salesRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Tim Sales Kanvas' } });
    const permCreate = await prisma.permission.findUniqueOrThrow({ where: { name: 'produk-destruction:create' } });

    tempPermId = permCreate.id;
    tempRoleId = salesRole.id;

    // 🔥 CEK: Apakah relasi sudah ada sebelumnya?
    const existingRelasi = await prisma.permissionRole.findFirst({
      where: { permission_id: tempPermId, role_id: tempRoleId }
    });
    permissionWasAlreadyAssigned = !!existingRelasi;

    if (!permissionWasAlreadyAssigned) {
      await prisma.permissionRole.create({
        data: { permission_id: tempPermId, role_id: tempRoleId }
      });
    }

    tokenB = jwtService.sign({ sub: salesUser.id, username: salesUser.username }, { secret: process.env.JWT_SECRET || 'secret' });

    // 3. User tanpa izin read (Kasir)
    const kasirUser = await prisma.user.findUniqueOrThrow({ where: { username: 'kasir' } });
    tokenNoRead = jwtService.sign({ sub: kasirUser.id, username: kasirUser.username }, { secret: process.env.JWT_SECRET || 'secret' });

    // 4. User tanpa izin create (Spv)
    const spvUser = await prisma.user.findUniqueOrThrow({ where: { username: 'spv' } });
    tokenNoPerm = jwtService.sign({ sub: spvUser.id, username: spvUser.username }, { secret: process.env.JWT_SECRET || 'secret' });

    // Setup Master Data
    const gudang = await prisma.gudang.create({ data: { nama_gudang: `G-${runId}`, tipe_gudang: 'Utama' } });
    gudangId = gudang.id;
    createdGudangIds.push(gudang.id);

    const produk = await prisma.product.create({
      data: { name: `Prod-${runId}`, code: `P-${runId}`, barcode: `B-${runId}`, product_brand_id: 1, product_type_id: 1, sale_report_group_id: 1, supplier_id: 1, is_active: true, type_price: 'FIXED', user_id: userIdA, ip: '1' }
    });
    produkId = produk.id;
    createdProdukIds.push(produk.id);

    const batch = await prisma.batch.create({
      data: { produk_id: produkId, no_batch: `BATCH-${runId}`, expired_date: new Date(new Date().setFullYear(2026)), stok_gudang: 1000 }
    });
    batchId = batch.id;
    createdBatchIds.push(batch.id);
  });

  afterAll(async () => {
    if (!app) return;

    // Cleanup Data
    await prisma.mutasiBatch.deleteMany({ where: { batch: { produk_id: produkId } } });
    await prisma.produkDestructionDetail.deleteMany({ where: { produkDestruction: { gudang_id: gudangId } } });
    await prisma.produkDestruction.deleteMany({ where: { gudang_id: gudangId } });
    await prisma.batch.deleteMany({ where: { id: { in: createdBatchIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProdukIds } } });
    await prisma.gudang.deleteMany({ where: { id: { in: createdGudangIds } } });

    // 🔥 HANYA HAPUS RELASI JIKA TEST YANG MEMBUATNYA
    if (!permissionWasAlreadyAssigned) {
      await prisma.permissionRole.deleteMany({
        where: { permission_id: tempPermId, role_id: tempRoleId }
      });
    }

    await app.close();
  });

  const reqCreate = (qty: number, key?: string, token = tokenA, isInvalidBatch = false) => {
    const payload = {
      gudang_id: gudangId,
      tgl_destruction: '2026-11-14T10:00:00.000Z',
      alasan: 'Test',
      details: [{ batch_id: isInvalidBatch ? 999999 : batchId, produk_id: produkId, qty_dimusnahkan: qty }]
    };
    const req = request(app.getHttpServer())
      .post('/api/transaksi/produk-destruction')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    if (key) req.set('x-idempotency-key', key);
    return req;
  };

  // ==================== 5.5a TESTS (Stock & Permission) ====================
  it('1. Disposal berhasil & stok berkurang', async () => {
    const res = await reqCreate(10).expect(201);
    const batch = await prisma.batch.findUniqueOrThrow({ where: { id: batchId } });
    expect(batch.stok_gudang).toBe(990);
  });

  it('2. MutasiBatch tercatat OUT', async () => {
    const mutasi = await prisma.mutasiBatch.findFirstOrThrow({ where: { batch_id: batchId, tipe_mutasi: 'OUT' }, orderBy: { id: 'desc' } });
    expect(mutasi.qty).toBe(10);
  });

  it('3. Disposal melebihi stok ditolak (400)', async () => { await reqCreate(9999).expect(400); });
  it('4. Disposal dengan qty negatif ditolak (400)', async () => { await reqCreate(-5).expect(400); });
  it('5. Batch tidak ditemukan (404)', async () => { await reqCreate(1, undefined, tokenA, true).expect(404); });

  it('6. Concurrent Different Keys: stok aman', async () => {
    await prisma.batch.update({ where: { id: batchId }, data: { stok_gudang: 100 } });
    const responses = await Promise.all(Array(3).fill(null).map((_, i) => reqCreate(30, `diff-${runId}-${i}`)));
    responses.forEach(r => expect(r.status).toBe(201));
    const batch = await prisma.batch.findUniqueOrThrow({ where: { id: batchId } });
    expect(batch.stok_gudang).toBe(10);
  });

  it('7. Permission: User tanpa izin create ditolak (403)', async () => { await reqCreate(1, undefined, tokenNoPerm).expect(403); });
  it('8. Permission Read: User tanpa izin read ditolak (403)', async () => {
    await request(app.getHttpServer()).get('/api/transaksi/produk-destruction').set('Authorization', `Bearer ${tokenNoRead}`).expect(403);
  });

  it('9. Rollback: Gagal setelah decrement tidak mengubah stok', async () => {
    await prisma.batch.update({ where: { id: batchId }, data: { stok_gudang: 100 } });
    await request(app.getHttpServer()).post('/api/transaksi/produk-destruction').set('Authorization', `Bearer ${tokenA}`)
      .send({ gudang_id: gudangId, tgl_destruction: new Date().toISOString(), alasan: 'Test',
        details: [{ batch_id: batchId, produk_id: produkId, qty_dimusnahkan: 10 }, { batch_id: 999999, produk_id: produkId, qty_dimusnahkan: 10 }]
      }).expect(404);
    expect((await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang).toBe(100);
  });

  // ==================== 5.5b TESTS (Idempotency) ====================
  it('10. Sequential same key: stok hanya berkurang sekali', async () => {
    await prisma.batch.update({ where: { id: batchId }, data: { stok_gudang: 1000 } });
    const key = `seq-same-${runId}`;
    const res1 = await reqCreate(10, key).expect(201);
    const res2 = await reqCreate(10, key).expect(201);
    expect(res1.body.data.id).toBe(res2.body.data.id);
    expect((await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang).toBe(990);
  });

  it('11. Concurrent same key (5 paralel): stok hanya berkurang sekali', async () => {
    await prisma.batch.update({ where: { id: batchId }, data: { stok_gudang: 1000 } });
    const key = `conc-same-${runId}`;
    const responses = await Promise.all(Array(5).fill(null).map(() => reqCreate(5, key)));
    responses.forEach(r => expect(r.status).toBe(201));
    const uniqueIds = new Set(responses.map(r => r.body.data.id));
    expect(uniqueIds.size).toBe(1);
    expect((await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang).toBe(995);
  });

  it('12. Same key + different payload: 409', async () => {
    const key = `conflict-${runId}`;
    await reqCreate(7, key).expect(201);
    await reqCreate(99, key).expect(409);
    expect((await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang).toBe(988);
  });

  it('13. Cross-user: user berbeda dengan key sama', async () => {
    const key = `cross-user-${runId}`;
    const stockBefore = (await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang;
    const resA = await reqCreate(3, key, tokenA).expect(201);
    const resB = await reqCreate(3, key, tokenB).expect(201);
    expect(resA.body.data.id).not.toBe(resB.body.data.id);
    expect((await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang).toBe(stockBefore - 6);
  });

  it('14. Rollback: kegagalan tidak meninggalkan idempotency record', async () => {
    const key = `rollback-idem-${runId}`;
    const stockBefore = (await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang;
    await request(app.getHttpServer()).post('/api/transaksi/produk-destruction').set('Authorization', `Bearer ${tokenA}`).set('x-idempotency-key', key)
      .send({ gudang_id: gudangId, tgl_destruction: new Date().toISOString(), alasan: 'Test',
        details: [{ batch_id: batchId, produk_id: produkId, qty_dimusnahkan: 10 }, { batch_id: 999999, produk_id: produkId, qty_dimusnahkan: 10 }]
      }).expect(404);
    expect((await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang).toBe(stockBefore);
    expect(await prisma.produkDestruction.findUnique({ where: { idempotency_key: `${userIdA}-${key}` } })).toBeNull();
    await reqCreate(5, key).expect(201);
  });

  // ==================== RETRY TESTS (5.5b) ====================
  it('15. Retry P2034: percobaan pertama gagal, retry sukses', async () => {
    await prisma.batch.update({ where: { id: batchId }, data: { stok_gudang: 1000 } });
    const key = `retry-p2034-${runId}`;

    const p2034Error = new Error('Simulated serialization failure');
    (p2034Error as any).code = 'P2034';

    let mockCallCount = 0;
    const spy = jest.spyOn(prisma, '$transaction').mockImplementationOnce(async () => {
      mockCallCount++;
      throw p2034Error;
    });

    try {
      const res = await reqCreate(5, key).expect(201);

      // Verifikasi retry: mock terpanggil sekali, response 201 = retry berhasil
      expect(mockCallCount).toBe(1);

      // Verifikasi: hanya 1 header, 1 detail, 1 mutasi
      const headers = await prisma.produkDestruction.findMany({ where: { idempotency_key: `${userIdA}-${key}` } });
      expect(headers.length).toBe(1);

      const details = await prisma.produkDestructionDetail.count({ where: { produk_destruction_id: headers[0].id } });
      expect(details).toBe(1);

      // Verifikasi: stok hanya berkurang sekali
      expect((await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang).toBe(995);
    } finally {
      spy.mockRestore();
    }
  });

  it('16. Retry P2010 (40001): percobaan pertama gagal, retry sukses', async () => {
    await prisma.batch.update({ where: { id: batchId }, data: { stok_gudang: 1000 } });
    const key = `retry-p2010-${runId}`;

    const p2010Error = new Error('Simulated 40001');
    (p2010Error as any).code = 'P2010';
    (p2010Error as any).meta = { cause: { originalCode: '40001' } };

    let mockCallCount = 0;
    const spy = jest.spyOn(prisma, '$transaction').mockImplementationOnce(async () => {
      mockCallCount++;
      throw p2010Error;
    });

    try {
      const res = await reqCreate(3, key).expect(201);
      expect(mockCallCount).toBe(1);

      const headers = await prisma.produkDestruction.findMany({ where: { idempotency_key: `${userIdA}-${key}` } });
      expect(headers.length).toBe(1);

      expect((await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang).toBe(997);
    } finally {
      spy.mockRestore();
    }
  });

  it('17. Non-retryable P2010 (23505): TIDAK di-retry', async () => {
    await prisma.batch.update({ where: { id: batchId }, data: { stok_gudang: 1000 } });
    const key = `nonretry-${runId}`;

    const p2010Error = new Error('Simulated 23505');
    (p2010Error as any).code = 'P2010';
    (p2010Error as any).meta = { cause: { originalCode: '23505' } }; // bukan 40001/40P01

    let mockCallCount = 0;
    const spy = jest.spyOn(prisma, '$transaction').mockImplementationOnce(async () => {
      mockCallCount++;
      throw p2010Error;
    });

    try {
      // Harus 500, bukan 201 (tidak retry)
      await reqCreate(3, key).expect(500);

      // Verifikasi: hanya 1 panggilan (tidak retry)
      expect(mockCallCount).toBe(1);

      // Verifikasi: stok tidak berubah
      expect((await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).stok_gudang).toBe(1000);
    } finally {
      spy.mockRestore();
    }
  });
});