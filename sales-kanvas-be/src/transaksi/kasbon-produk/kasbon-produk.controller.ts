import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KasbonProdukService } from './kasbon-produk.service';
import { CreateKasbonProdukDto } from './dto/kasbon-produk.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Transaksi - BON Barang')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/kasbon-produk')
export class KasbonProdukController {
  constructor(private readonly kasbonProdukService: KasbonProdukService) {}

  @Post()
  @RequirePermission('kasbon-produk:write')
  create(@Body() dto: CreateKasbonProdukDto) {
    return this.kasbonProdukService.create(dto);
  }

  @Get()
  @RequirePermission('kasbon-produk:read')
  findAll() {
    return this.kasbonProdukService.findAll();
  }
}