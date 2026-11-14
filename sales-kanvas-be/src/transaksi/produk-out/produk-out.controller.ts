import {
  Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, UseInterceptors, Req, Headers
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';

import { ProdukOutService } from './produk-out.service';
import { CreateProdukOutDto } from './dto/produk-out.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

@ApiTags('Transaksi - Loading (Produk Out)')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/produk-out')
export class ProdukOutController {
  constructor(private readonly produkOutService: ProdukOutService) {}

  @Post()
  @RequirePermission('produk-out:create')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Proses Onloading barang dari BON (FEFO otomatis)' })
  create(
    @Body() dto: CreateProdukOutDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.produkOutService.create(dto, user.id, req.ip ?? '127.0.0.1', idempotencyKey);
  }

  @Get()
  @RequirePermission('produk-out:read')
  @ApiOperation({ summary: 'Ambil semua data Onloading yang aktif' })
  findAll() {
    return this.produkOutService.findAll();
  }

  // 🔥 ENDPOINT BARU UNTUK DETAIL
  @Get(':id')
  @RequirePermission('produk-out:read')
  @ApiOperation({ summary: 'Ambil detail Onloading berdasarkan ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.produkOutService.findOne(id, user);
  }

  @Post(':id/cancel')
  @RequirePermission('produk-out:update')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({
    summary: 'Batalkan Onloading — stok dikembalikan, BON kembali ke DRAFT',
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.produkOutService.cancel(id, user.id, req.ip ?? '127.0.0.1');
  }
}