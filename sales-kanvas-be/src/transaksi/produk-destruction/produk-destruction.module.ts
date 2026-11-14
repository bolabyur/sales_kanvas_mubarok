import { Module } from '@nestjs/common';
import { ProdukDestructionService } from './produk-destruction.service';
import { ProdukDestructionController } from './produk-destruction.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CodeGeneratorModule } from 'src/common/services/code-generator.module';

@Module({
  imports: [PrismaModule, CodeGeneratorModule],
  controllers: [ProdukDestructionController],
  providers: [ProdukDestructionService],
})
export class ProdukDestructionModule {}