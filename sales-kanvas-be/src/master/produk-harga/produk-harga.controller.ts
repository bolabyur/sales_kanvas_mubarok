import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProdukHargaService } from './produk-harga.service';
import { CreateProdukHargaDto, UpdateProdukHargaDto } from './dto/produk-harga.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Master - Produk Harga')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('master/produk-harga')
export class ProdukHargaController {
  constructor(private readonly service: ProdukHargaService) {}

  @Get()
  @RequirePermission('produk-harga:read')
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @RequirePermission('produk-harga:read')
  findOne(@Param('id') id: string) { return this.service.findOne(+id); }

  @Post()
  @RequirePermission('produk-harga:write')
  create(@Body() dto: CreateProdukHargaDto) { return this.service.create(dto); }

  @Patch(':id')
  @RequirePermission('produk-harga:write')
  update(@Param('id') id: string, @Body() dto: UpdateProdukHargaDto) { return this.service.update(+id, dto); }

  @Delete(':id')
  @RequirePermission('produk-harga:write')
  remove(@Param('id') id: string) { return this.service.remove(+id); }
}