import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CodeGeneratorModule } from '../common/services/code-generator.module';
@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    CodeGeneratorModule, 
  ],
  controllers: [PlanController],
  providers: [PlanService],
})
export class PlanModule {}