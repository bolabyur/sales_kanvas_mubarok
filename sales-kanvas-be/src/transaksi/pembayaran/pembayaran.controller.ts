import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PembayaranService } from './pembayaran.service';
import { CreatePembayaranDto } from './dto/pembayaran.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Transaksi - Pembayaran')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/pembayaran')
export class PembayaranController {
  constructor(private readonly pembayaranService: PembayaranService) {}

  @Post()
  @RequirePermission('pembayaran:write')
  create(@Body() dto: CreatePembayaranDto) {
    return this.pembayaranService.create(dto);
  }

  @Get()
  @RequirePermission('pembayaran:read')
  findAll() {
    return this.pembayaranService.findAll();
  }
}