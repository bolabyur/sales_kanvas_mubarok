import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PlanOutletService } from './plan-outlet.service';
import { CreatePlanOutletDto } from './dto/plan-outlet.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

@ApiTags('Transaksi - Rute Kunjungan')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/plan-outlet')
export class PlanOutletController {
  constructor(private readonly planOutletService: PlanOutletService) {}

  @Post()
  @RequirePermission('plan-outlet:write')
  @UseInterceptors(IdempotencyInterceptor)
  create(@Body() dto: CreatePlanOutletDto) {
    return this.planOutletService.create(dto);
  }

  @Get(':planId')
  @RequirePermission('plan-outlet:read')
  findByPlan(@Param('planId') planId: string) {
    return this.planOutletService.findByPlan(+planId);
  }
}