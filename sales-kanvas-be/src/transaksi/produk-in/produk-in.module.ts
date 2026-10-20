import { Module } from '@nestjs/common';
import { ProdukInService } from './produk-in.service';
import { ProdukInController } from './produk-in.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProdukInController],
  providers: [ProdukInService],
})
export class ProdukInModule {}