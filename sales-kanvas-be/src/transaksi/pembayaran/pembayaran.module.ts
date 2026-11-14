import { Module } from '@nestjs/common';
import { PembayaranService } from './pembayaran.service';
import { PembayaranController } from './pembayaran.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CodeGeneratorService } from '../../common/services/code-generator.service'; 

@Module({
  imports: [PrismaModule],
  controllers: [PembayaranController],
  providers: [
    PembayaranService,
    CodeGeneratorService, 
  ],
})
export class PembayaranModule {}