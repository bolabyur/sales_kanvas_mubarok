import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProdukInService } from './produk-in.service';
import { CreateProdukInDto } from './dto/produk-in.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Transaksi - Unloading (Produk In)')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/produk-in')
export class ProdukInController {
  constructor(private readonly produkInService: ProdukInService) {}

  @Post()
  @RequirePermission('produk-in:write')
  create(@Body() dto: CreateProdukInDto) {
    return this.produkInService.create(dto);
  }

  @Get()
  @RequirePermission('produk-in:read')
  findAll() {
    return this.produkInService.findAll();
  }
}