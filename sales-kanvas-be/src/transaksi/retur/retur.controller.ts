import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReturService } from './retur.service';
import { CreateReturDto } from './dto/retur.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Transaksi - Retur')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/retur')
export class ReturController {
  constructor(private readonly returService: ReturService) {}

  @Post()
  @RequirePermission('retur:write')
  create(@Body() dto: CreateReturDto) {
    return this.returService.create(dto);
  }

  @Get()
  @RequirePermission('retur:read')
  findAll() {
    return this.returService.findAll();
  }
}