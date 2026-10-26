import { Module } from '@nestjs/common';
import { KanvasReturnService } from './kanvas-return.service';
import { KanvasReturnController } from './kanvas-return.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KanvasReturnController],
  providers: [KanvasReturnService],
})
export class KanvasReturnModule {}