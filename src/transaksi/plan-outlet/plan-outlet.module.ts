import { Module } from '@nestjs/common';
import { PlanOutletService } from './plan-outlet.service';
import { PlanOutletController } from './plan-outlet.controller';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [PrismaModule], controllers: [PlanOutletController], providers: [PlanOutletService] })
export class PlanOutletModule {}