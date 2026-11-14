import { Module } from '@nestjs/common';
import { ProdukOutService } from './produk-out.service';
import { ProdukOutController } from './produk-out.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CodeGeneratorService } from 'src/common/services/code-generator.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProdukOutController],
  providers: [ProdukOutService, CodeGeneratorService],
})
export class ProdukOutModule {}