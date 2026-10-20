import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProdukOutService } from './produk-out.service';
import { CreateProdukOutDto } from './dto/produk-out.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Transaksi - Loading (Produk Out)')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/produk-out')
export class ProdukOutController {
  constructor(private readonly produkOutService: ProdukOutService) {}

  @Post()
  @RequirePermission('produk-out:write')
  create(@Body() dto: CreateProdukOutDto) {
    return this.produkOutService.create(dto);
  }

  @Get()
  @RequirePermission('produk-out:read')
  findAll() {
    return this.produkOutService.findAll();
  }
}