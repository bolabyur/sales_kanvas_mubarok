import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { CodeGeneratorService } from '../src/common/services/code-generator.service';
import { AppModule } from '../src/app.module';

describe('CodeGeneratorService Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let generator: CodeGeneratorService;

  // ⚠️ Scope: only INV + date_key 261112 (test date). NEVER wipe global.
  const TEST_PREFIX = 'INV';
  const TEST_DATE_KEY = '261112';
  const TEST_DATE = new Date('2026-11-12T10:00:00+07:00');

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    generator = app.get(CodeGeneratorService);

    // Clean ONLY test's own sequence, never global
    await prisma.documentSequence.deleteMany({
      where: { prefix: TEST_PREFIX, date_key: TEST_DATE_KEY },
    });
  });

  afterAll(async () => {
    try {
      // Cleanup only this test's own sequence
      await prisma.documentSequence.deleteMany({
        where: { prefix: TEST_PREFIX, date_key: TEST_DATE_KEY },
      });
    } finally {
      if (app) await app.close();
    }
  });

  it('should handle 10 concurrent transactions safely', async () => {
    const promises = Array(10).fill(null).map(() => 
      prisma.$transaction(async (tx) => {
        return generator.generate(tx, TEST_PREFIX, TEST_DATE);
      })
    );

    const results = await Promise.all(promises);

    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(10);

    const sequence = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: TEST_PREFIX, date_key: TEST_DATE_KEY } },
    });
    expect(sequence?.last_number).toBe(10);
  });

  it('should rollback counter when transaction fails', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        await generator.generate(tx, TEST_PREFIX, TEST_DATE);
        throw new Error('Simulasi Gagal');
      });
    } catch (e) {
      // Abaikan error — expected
    }

    const sequence = await prisma.documentSequence.findUnique({
      where: { prefix_date_key: { prefix: TEST_PREFIX, date_key: TEST_DATE_KEY } },
    });
    expect(sequence?.last_number).toBe(10);
  });
});