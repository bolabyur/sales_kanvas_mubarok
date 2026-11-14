import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Plan Numbering & Idempotency (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let areaId: number;
  let vehicleId: number;
  const runId = Date.now();
  const createdPlanIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = app.get(PrismaService);
    const jwtService = app.get(JwtService);

    const user = await prisma.user.findUniqueOrThrow({ where: { username: 'sales' } });
    token = jwtService.sign({ sub: user.id, username: user.username }, { secret: process.env.JWT_SECRET || 'secret' });

    const area = await prisma.marketArea.create({
      data: { name: `Area-PLN-${runId}`, user_id: 1, ip: '1' },
    });
    areaId = area.id;

    const veh = await prisma.vehicele.create({
      data: {
        name: `V-PLN-${runId}`, nopol: `KPLN${runId}`,
        type_vehicle: 'T', type_fuel: 'S',
        user_id: 1, ip: '1',
      },
    });
    vehicleId = veh.id;

    // ⚠️ Plan uses server time for documentDate — do NOT touch sequence here.
    // Test uses delta assertion — no need to reset sequence.
  });

  afterAll(async () => {
    if (!app) return;
    try {
      if (createdPlanIds.length > 0) {
        // 1. Child tables first (FK RESTRICT)
        await prisma.salesKanvasPersonil.deleteMany({
          where: { sales_kanvas_plan_id: { in: createdPlanIds } },
        }).catch(() => {});
        await prisma.salesKanvasPlanDetail.deleteMany({
          where: { sales_kanvas_plan_id: { in: createdPlanIds } },
        }).catch(() => {});
        await prisma.salesKanvasKasbonMaterial.deleteMany({
          where: { sales_kanvas_plan_id: { in: createdPlanIds } },
        }).catch(() => {});
        // FIX: salesKanvasPlanOutlet (bukan rencanaKanvasOutlet)
        await prisma.salesKanvasPlanOutlet.deleteMany({
          where: { sales_kanvas_plan_id: { in: createdPlanIds } },
        }).catch(() => {});

        // 2. Grandparent
        await prisma.salesKanvasPlan.deleteMany({
          where: { id: { in: createdPlanIds } },
        });
      }

      if (vehicleId) await prisma.vehicele.deleteMany({ where: { id: vehicleId } });
      if (areaId) await prisma.marketArea.deleteMany({ where: { id: areaId } });

      // JANGAN hapus documentSequence — biarkan terus naik
    } finally {
      await app.close();
    }
  });

  const payload = {
    tgl_invoice: new Date().toISOString(),
    tgl_pergi_kanvas: new Date().toISOString(),
    market_area_id: 0,
    vehicle_id: 0,
    note: 'Test',
    salesKanvasPersonil: [{ employee_id: 1, position: 'Sales' }],
  };

  const reqCreate = (key?: string) => {
    const p = { ...payload, market_area_id: areaId, vehicle_id: vehicleId };
    let req = request(app.getHttpServer())
      .post('/api/plan')
      .set('Authorization', `Bearer ${token}`)
      .send(p);
    if (key) req = req.set('x-idempotency-key', key);
    return req;
  };

  it('A & B. Create Plan Sequential (increment by 1)', async () => {
    const res1 = await reqCreate().expect(201);
    createdPlanIds.push(res1.body.data.id);
    expect(res1.body.data.invoice).toMatch(/^PLN-\d{6}-\d{3,}$/);
    const num1 = parseInt(res1.body.data.invoice.split('-')[2], 10);

    const res2 = await reqCreate().expect(201);
    createdPlanIds.push(res2.body.data.id);
    expect(res2.body.data.invoice).toMatch(/^PLN-\d{6}-\d{3,}$/);
    const num2 = parseInt(res2.body.data.invoice.split('-')[2], 10);

    expect(num2).toBe(num1 + 1);
  });

  it('D. Concurrency: 10 requests parallel', async () => {
    const requests = Array(10).fill(null).map(() => reqCreate());
    const responses = await Promise.all(requests);
    responses.forEach((res) => {
      expect(res.status).toBe(201);
      createdPlanIds.push(res.body.data.id);
    });
    const invoices = responses.map((r) => r.body.data.invoice);
    const uniqueInvoices = new Set(invoices);
    expect(uniqueInvoices.size).toBe(10);
  });

  it('E. Idempotency: Replay returns same Plan', async () => {
    const key = `test-idem-${runId}`;
    const res1 = await reqCreate(key).expect(201);
    createdPlanIds.push(res1.body.data.id);
    const res2 = await reqCreate(key).expect(201);
    expect(res1.body.data.id).toBe(res2.body.data.id);
    expect(res1.body.data.invoice).toBe(res2.body.data.invoice);
  });

  it('E. Idempotency: Conflict payload -> 409', async () => {
    const key = `test-conflict-${runId}`;
    const res = await reqCreate(key).expect(201);
    createdPlanIds.push(res.body.data.id);
    const p = { ...payload, market_area_id: areaId, vehicle_id: vehicleId, note: 'BEDA' };
    await request(app.getHttpServer())
      .post('/api/plan')
      .set('Authorization', `Bearer ${token}`)
      .set('x-idempotency-key', key)
      .send(p)
      .expect(409);
  });
});