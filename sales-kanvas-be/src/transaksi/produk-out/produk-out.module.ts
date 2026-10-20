import { Module } from '@nestjs/common';
import { ProdukOutService } from './produk-out.service';
import { ProdukOutController } from './produk-out.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProdukOutController],
  providers: [ProdukOutService],
})
export class ProdukOutModule {}