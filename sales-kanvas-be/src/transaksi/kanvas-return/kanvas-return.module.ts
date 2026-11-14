import { Module } from '@nestjs/common';
import { KanvasReturnService } from './kanvas-return.service';
import { KanvasReturnController } from './kanvas-return.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CodeGeneratorService } from 'src/common/services/code-generator.service';

@Module({
  imports: [PrismaModule],
  controllers: [KanvasReturnController],
  providers: [KanvasReturnService, CodeGeneratorService],
})
export class KanvasReturnModule {}