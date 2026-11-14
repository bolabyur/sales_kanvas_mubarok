import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ProdukDestructionService } from '../src/transaksi/produk-destruction/produk-destruction.service';

describe('TASK 08.0.5.5c - DSP Document Numbering (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenA: string;
  let tokenB: string;
  let userIdA: number;
  let userIdB: number;

  let gudangId: number | undefined;
  let produkId: number | undefined;
  let batchId: number | undefined;

  let tempPermId: number | undefined;
  let tempRoleId: number | undefined;
  let permissionWasAlreadyAssigned = false;

  const runId = Date.now();

  const dateFor = (day: number): string =>
    `2030-01-${String(day).padStart(2, '0')}T10:00:00.000Z`;

  const dateKeyFor = (day: number): string => `3001${String(day).padStart(2, '0')}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get(PrismaService);
    const jwtService = app.get(JwtService);

    const userA = await prisma.user.findUniqueOrThrow({ where: { username: 'superadmin' } });
    userIdA = userA.id;
    tokenA = jwtService.sign(
      { sub: userIdA, username: userA.username },
      { secret: process.env.JWT_SECRET || 'secret' }
    );

    const salesUser = await prisma.user.findUniqueOrThrow({ where: { username: 'sales' } });
    userIdB = salesUser.id;

    const salesRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Tim Sales Kanvas' } });
    const permCreate = await prisma.permission.findUniqueOrThrow({
      where: { name: 'produk-destruction:create' },
    });

    tempPermId = permCreate.id;
    tempRoleId = salesRole.id;

    const existingRelasi = await prisma.permissionRole.findFirst({
      where: { permission_id: tempPermId, role_id: tempRoleId },
    });
    permissionWasAlreadyAssigned = !!existingRelasi;

    if (!permissionWasAlreadyAssigned) {
      await prisma.permissionRole.create({
        data: { permission_id: tempPermId, role_id: tempRoleId },
      });
    }

    tokenB = jwtService.sign(
      { sub: userIdB, username: salesUser.username },
      { secret: process.env.JWT_SECRET || 'secret' }
    );

    const gudang = await prisma.gudang.create({
      data: { nama_gudang: `G-DSPNUM-${runId}`, tipe_gudang: 'Utama' },
    });
    gudangId = gudang.id;

    const produk = await prisma.product.create({
      data: {
        name: `ProdDSPNum-${runId}`,
        code: `PDN-${runId}`,
        barcode: `BDN-${runId}`,
        product_brand_id: 1,
        product_type_id: 1,
        sale_report_group_id: 1,
        supplier_id: 1,
        is_active: true,
        type_price: 'FIXED',
        user_id: userIdA,
        ip: '1',
      },
    });
    produkId = produk.id;

    const batch = await prisma.batch.create({
      data: {
        produk_id: produkId,
        no_batch: `BATCH-DSPNUM-${runId}`,
        expired_date: new Date(new Date().setFullYear(2027)),
        stok_gudang: 100000,
      },
    });
    batchId = batch.id;
  });

  afterAll(async () => {
    if (!app) return;

    try {
      if (produkId !== undefined) {
        await prisma.mutasiBatch.deleteMany({ where: { batch: { produk_id: produkId } } });
      }
      if (gudangId !== undefined) {
        await prisma.produkDestructionDetail.deleteMany({
          where: { produkDestruction: { gudang_id: gudangId } },
        });
        await prisma.produkDestruction.deleteMany({ where: { gudang_id: gudangId } });
      }
      if (batchId !== undefined) {
        await prisma.batch.deleteMany({ where: { id: batchId } });
      }
      if (produkId !== undefined) {
        await prisma.product.deleteMany({ where: { id: produkId } });
      }
      if (gudangId !== undefined) {
        await prisma.gudang.deleteMany({ where: { id: gudangId } });
      }
      if (!permissionWasAlreadyAssigned
          && tempPermId !== undefined
          && tempRoleId !== undefined) {
        await prisma.permissionRole.deleteMany({
          where: { permission_id: tempPermId, role_id: tempRoleId },
        });
      }
    } finally {
      await app.close();
    }
  });

  const reqCreate = (
    qty: number,
    tglDestruction: string,
    key?: string,
    token = tokenA
  ) => {
    const payload = {
      gudang_id: gudangId,
      tgl_destruction: tglDestruction,
      alasan: 'Test DSP Numbering',
      details: [{ batch_id: batchId, produk_id: produkId, qty_dimusnahkan: qty }],
    };
    const req = request(app.getHttpServer())
      .post('/api/transaksi/produk-destruction')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    if (key) req.set('x-idempotency-key', key);
    return req;
  };

  // ==================== A. Sequential Numbering ====================
  it('A. Sequential: 2 dokumen di tanggal sama, counter berurutan', async () => {
    const res1 = await reqCreate(1, dateFor(1)).expect(201);
    expect(res1.body.data.document_number).toMatch(/^DSP-300101-\d{3}$/);
    const num1 = parseInt(res1.body.data.document_number.split('-')[2], 10);

    const res2 = await reqCreate(1, dateFor(1)).expect(201);
    expect(res2.body.data.document_number).toMatch(/^DSP-300101-\d{3}$/);
    const num2 = parseInt(res2.body.data.document_number.split('-')[2], 10);

    expect(num2).toBe(num1 + 1);
  });

  // ==================== B. Date Separation ====================
  it('B. Date Separation: tanggal berbeda memiliki counter sendiri', async () => {
    const res1 = await reqCreate(1, dateFor(2)).expect(201);
    expect(res1.body.data.document_number).toMatch(/^DSP-300102-\d{3}$/);

    const res2 = await reqCreate(1, dateFor(3)).expect(201);
    expect(res2.body.data.document_number).toMatch(/^DSP-300103-\d{3}$/);

    expect(res1.body.data.document_number.substring(4, 10)).toBe('300102');
    expect(res2.body.data.document_number.substring(4, 10)).toBe('300103');
  });

  // ==================== C. Concurrent Different Keys (HARDENED) ====================
  it('C. Concurrent Different Keys: 10 request, 10 nomor unik, sequence +10 tepat', async () => {
    const dateKey = dateKeyFor(4);

    const seqBefore = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: 'DSP', date_key: dateKey } },
    });
    const lastNumBefore = seqBefore?.last_number || 0;

    const requests = Array(10)
      .fill(null)
      .map((_, i) => reqCreate(1, dateFor(4), `conc-diff-${runId}-${i}`));

    const responses = await Promise.all(requests);

    responses.forEach((r) => expect(r.status).toBe(201));

    const docNumbers = responses.map((r) => r.body.data.document_number);
    expect(new Set(docNumbers).size).toBe(10);

    const seqAfter = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: 'DSP', date_key: dateKey } },
    });

    expect(seqAfter?.last_number).toBe(lastNumBefore + 10);
  }, 30000);

  // ==================== D. Concurrent Same Key ====================
  it('D. Concurrent Same Key: 5 request, 1 dokumen, 1 nomor', async () => {
    const key = `conc-same-${runId}`;
    const dateKey = dateKeyFor(5);

    const seqBefore = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: 'DSP', date_key: dateKey } },
    });
    const lastNumBefore = seqBefore?.last_number || 0;

    const requests = Array(5)
      .fill(null)
      .map(() => reqCreate(1, dateFor(5), key));

    const responses = await Promise.all(requests);
    responses.forEach((r) => expect(r.status).toBe(201));

    const ids = new Set(responses.map((r) => r.body.data.id));
    expect(ids.size).toBe(1);

    const docNumbers = new Set(responses.map((r) => r.body.data.document_number));
    expect(docNumbers.size).toBe(1);

    const seqAfter = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: 'DSP', date_key: dateKey } },
    });
    expect(seqAfter?.last_number).toBe(lastNumBefore + 1);
  }, 30000);

  // ==================== E. Idempotency Replay ====================
  it('E. Idempotency Replay: nomor sama, sequence tidak bertambah', async () => {
    const key = `replay-${runId}`;
    const dateKey = dateKeyFor(6);

    const seqBefore = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: 'DSP', date_key: dateKey } },
    });
    const lastNumBefore = seqBefore?.last_number || 0;

    const res1 = await reqCreate(1, dateFor(6), key).expect(201);
    const res2 = await reqCreate(1, dateFor(6), key).expect(201);

    expect(res1.body.data.document_number).toBe(res2.body.data.document_number);

    const seqAfter = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: 'DSP', date_key: dateKey } },
    });
    expect(seqAfter?.last_number).toBe(lastNumBefore + 1);
  });

  // ==================== F. Payload Conflict ====================
  it('F. Payload Conflict: 409, sequence tidak bertambah dari request kedua', async () => {
    const key = `conflict-${runId}`;
    const dateKey = dateKeyFor(7);

    const seqBefore = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: 'DSP', date_key: dateKey } },
    });
    const lastNumBefore = seqBefore?.last_number || 0;

    await reqCreate(1, dateFor(7), key).expect(201);
    await reqCreate(99, dateFor(7), key).expect(409);

    const seqAfter = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: 'DSP', date_key: dateKey } },
    });
    expect(seqAfter?.last_number).toBe(lastNumBefore + 1);
  });

  // ==================== G. Transaction Rollback ====================
  it('G. Rollback setelah generator: sequence, stok, header, detail, mutasi tidak berubah', async () => {
    const dateKey = dateKeyFor(8);

    const successRes = await reqCreate(1, dateFor(8)).expect(201);
    expect(successRes.body.data.document_number).toMatch(/^DSP-300108-\d{3}$/);

    const seqBefore = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: 'DSP', date_key: dateKey } },
    });
    const lastNumBefore = seqBefore!.last_number;

    const stockBefore = (await prisma.batch.findUniqueOrThrow({ where: { id: batchId } }))
      .stok_gudang;
    const headerBefore = await prisma.produkDestruction.count({ where: { gudang_id: gudangId } });
    const detailBefore = await prisma.produkDestructionDetail.count({
      where: { produkDestruction: { gudang_id: gudangId } },
    });
    const mutasiBefore = await prisma.mutasiBatch.count({ where: { batch_id: batchId } });

    const svc = app.get(ProdukDestructionService) as any;
    const genSpy = jest.spyOn(svc.codeGenerator, 'generate');

    try {
      await request(app.getHttpServer())
        .post('/api/transaksi/produk-destruction')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          gudang_id: gudangId,
          tgl_destruction: dateFor(8),
          alasan: 'Test Rollback',
          details: [
            { batch_id: batchId, produk_id: produkId, qty_dimusnahkan: 5 },
            { batch_id: 9999999, produk_id: produkId, qty_dimusnahkan: 5 },
          ],
        })
        .expect(404);

      expect(genSpy).toHaveBeenCalled();
    } finally {
      genSpy.mockRestore();
    }

    const seqAfter = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: 'DSP', date_key: dateKey } },
    });
    expect(seqAfter!.last_number).toBe(lastNumBefore);

    const stockAfter = (await prisma.batch.findUniqueOrThrow({ where: { id: batchId } }))
      .stok_gudang;
    expect(stockAfter).toBe(stockBefore);

    expect(await prisma.produkDestruction.count({ where: { gudang_id: gudangId } })).toBe(
      headerBefore
    );
    expect(
      await prisma.produkDestructionDetail.count({
        where: { produkDestruction: { gudang_id: gudangId } },
      })
    ).toBe(detailBefore);
    expect(await prisma.mutasiBatch.count({ where: { batch_id: batchId } })).toBe(mutasiBefore);

    const retryRes = await reqCreate(1, dateFor(8)).expect(201);
    const retryNum = parseInt(retryRes.body.data.document_number.split('-')[2], 10);
    expect(retryNum).toBe(lastNumBefore + 1);
  });

  // ==================== H. Cross-user Isolation ====================
  it('H. Cross-user Isolation: key sama, dokumen & nomor berbeda', async () => {
    const key = `cross-${runId}`;

    const resA = await reqCreate(1, dateFor(9), key, tokenA).expect(201);
    const resB = await reqCreate(1, dateFor(9), key, tokenB).expect(201);

    expect(resA.body.data.id).not.toBe(resB.body.data.id);
    expect(resA.body.data.document_number).not.toBe(resB.body.data.document_number);
  });

  // ==================== I. Historical Compatibility ====================
  it('I. Historical: DSP lama dengan document_number NULL tetap terbaca', async () => {
    // Guard fixture sebelum digunakan dalam create
    expect(gudangId).toBeDefined();
    const gudangIdSafe = gudangId as number;

    const legacy = await prisma.produkDestruction.create({
      data: {
        gudang_id: gudangIdSafe,
        tgl_destruction: new Date('2026-01-01'),
        alasan: 'Legacy test',
        status: 'DONE',
        user_id: userIdA,
        ip: '1',
      },
    });

    const found = await prisma.produkDestruction.findUnique({
      where: { id: legacy.id },
    });

    expect(found).not.toBeNull();
    expect(found!.document_number).toBeNull();

    await prisma.produkDestruction.delete({
      where: { id: legacy.id },
    });
  });
});