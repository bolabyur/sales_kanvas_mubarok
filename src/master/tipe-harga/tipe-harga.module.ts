import { Module } from '@nestjs/common';
import { TipeHargaService } from './tipe-harga.service';
import { TipeHargaController } from './tipe-harga.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TipeHargaController],
  providers: [TipeHargaService],
})
export class TipeHargaModule {}