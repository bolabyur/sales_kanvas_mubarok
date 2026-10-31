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
    
    const pool = new Pool({ 
      connectionString,
      max: 20,                       
      idleTimeoutMillis: 30000,      
      connectionTimeoutMillis: 5000, 
    });

    const adapter = new PrismaPg(pool);
    
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