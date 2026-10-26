import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    
    // KONFIGURASI POOL: Mencegah error query paralel & memory leak
    const pool = new Pool({ 
      connectionString,
      max: 20,                       // Maksimal 20 koneksi simultan
      idleTimeoutMillis: 30000,      // Tutup koneksi yang idle setelah 30 detik
      connectionTimeoutMillis: 5000, // Batas waktu koneksi 5 detik
    });

    const adapter = new PrismaPg(pool);
    
    // Panggil constructor PrismaClient dengan adapter
    super({ adapter });

    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Koneksi Database Berhasil');
    } catch (error) {
      this.logger.error('❌ Gagal Koneksi ke Database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('🔌 Koneksi Database Ditutup');
  }
}