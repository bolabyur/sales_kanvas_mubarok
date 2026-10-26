import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SummaryService } from './summary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { SummaryQueryDto } from './dto/summary.dto'; 

@ApiTags('Reporting - Summary') 
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('summary')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Get('sale')
  @RequirePermission('invoice:read')
  getSummarySale(@Query() query: SummaryQueryDto) {
    return this.summaryService.getSummarySale(query.startDate, query.endDate);
  }

  @Get('sale-zona')
  @RequirePermission('invoice:read')
  getSummarySaleZona(@Query() query: SummaryQueryDto) {
    return this.summaryService.getSummarySaleZona(query.startDate, query.endDate);
  }

  @Get('rekonsiliasi')
  @RequirePermission('pembayaran:read')
  getSummaryRekonsiliasi(@Query() query: SummaryQueryDto) {
    return this.summaryService.getSummaryRekonsiliasi(query.status);
  }
}