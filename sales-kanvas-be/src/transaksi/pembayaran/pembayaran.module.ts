import { Module } from '@nestjs/common';
import { PembayaranService } from './pembayaran.service';
import { PembayaranController } from './pembayaran.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PembayaranController],
  providers: [PembayaranService],
})
export class PembayaranModule {}