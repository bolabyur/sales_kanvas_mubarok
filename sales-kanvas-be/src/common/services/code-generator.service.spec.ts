import { Test, TestingModule } from '@nestjs/testing';
import { CodeGeneratorService } from './code-generator.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CodeGeneratorService', () => {
  let service: CodeGeneratorService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeGeneratorService,
        { provide: PrismaService, useValue: { $queryRaw: jest.fn() } },
      ],
    }).compile();

    service = module.get<CodeGeneratorService>(CodeGeneratorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should generate format PREFIX-YYMMDD-NNN', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValue([{ last_number: 1 }]) };
    const date = new Date('2026-11-12T10:00:00+07:00');
    const result = await service.generate(tx as any, 'INV', date);
    expect(result).toBe('INV-261112-001');
  });

  it('should handle timezone Asia/Jakarta correctly (cross-day UTC)', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValue([{ last_number: 5 }]) };
    const date = new Date('2026-11-11T20:00:00Z');
    const result = await service.generate(tx as any, 'INV', date);
    expect(result).toBe('INV-261112-005');
  });

  it('should throw when query returns empty', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValue([]) };
    await expect(service.generate(tx as any, 'INV', new Date())).rejects.toThrow(
      /gagal menghasilkan nomor/,
    );
  });

  it('should throw when query returns invalid shape', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValue([{ foo: 'bar' }]) };
    await expect(service.generate(tx as any, 'INV', new Date())).rejects.toThrow(
      /gagal menghasilkan nomor/,
    );
  });

  it('should format > 999 without truncation', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValue([{ last_number: 1000 }]) };
    const date = new Date('2026-11-12T10:00:00+07:00');
    const result = await service.generate(tx as any, 'INV', date);
    expect(result).toBe('INV-261112-1000');
  });
});