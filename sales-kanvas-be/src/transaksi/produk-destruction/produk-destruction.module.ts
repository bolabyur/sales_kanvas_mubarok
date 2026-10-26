import { Module } from '@nestjs/common';
import { ProdukDestructionService } from './produk-destruction.service';
import { ProdukDestructionController } from './produk-destruction.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProdukDestructionController],
  providers: [ProdukDestructionService],
})
export class ProdukDestructionModule {}