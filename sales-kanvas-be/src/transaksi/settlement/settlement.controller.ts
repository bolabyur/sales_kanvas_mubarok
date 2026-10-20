import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';
import { CreateSettlementDto } from './dto/settlement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Transaksi - Settlement')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post()
  @RequirePermission('settlement:write')
  create(@Body() dto: CreateSettlementDto) {
    return this.settlementService.create(dto);
  }

  @Get()
  @RequirePermission('settlement:read')
  findAll() {
    return this.settlementService.findAll();
  }
}