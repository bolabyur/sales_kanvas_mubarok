import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SummaryService } from './summary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@Controller('summary')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Get('sale')
  @RequirePermission('summary:read')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // <-- Maks 10 req/menit
  getSummarySale(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.summaryService.getSummarySale(startDate, endDate);
  }

  @Get('sale-zona')
  @RequirePermission('summary:read')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  getSummarySaleZona(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.summaryService.getSummarySaleZona(startDate, endDate);
  }

  @Get('rekonsiliasi')
  @RequirePermission('summary:read')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  getSummaryRekonsiliasi() {
    return this.summaryService.getSummaryRekonsiliasi();
  }
}