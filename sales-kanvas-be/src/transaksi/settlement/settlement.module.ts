import { Module } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementController } from './settlement.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CodeGeneratorModule } from '../../common/services/code-generator.module';

@Module({
  imports: [PrismaModule, CodeGeneratorModule],
  controllers: [SettlementController],
  providers: [SettlementService],
})
export class SettlementModule {}