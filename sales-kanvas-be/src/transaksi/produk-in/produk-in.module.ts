import { Module } from '@nestjs/common';
import { ProdukInService } from './produk-in.service';
import { ProdukInController } from './produk-in.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CodeGeneratorModule } from 'src/common/services/code-generator.module';

@Module({
  imports: [PrismaModule, CodeGeneratorModule],
  controllers: [ProdukInController],
  providers: [ProdukInService],
})
export class ProdukInModule {}