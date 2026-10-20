import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TipeHargaService } from './tipe-harga.service';
import { CreateTipeHargaDto, UpdateTipeHargaDto } from './dto/tipe-harga.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Master - Tipe Harga')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('master/tipe-harga')
export class TipeHargaController {
  constructor(private readonly service: TipeHargaService) {}

  @Get()
  @RequirePermission('tipe-harga:read')
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @RequirePermission('tipe-harga:read')
  findOne(@Param('id') id: string) { return this.service.findOne(+id); }

  @Post()
  @RequirePermission('tipe-harga:write')
  create(@Body() dto: CreateTipeHargaDto) { return this.service.create(dto); }

  @Patch(':id')
  @RequirePermission('tipe-harga:write')
  update(@Param('id') id: string, @Body() dto: UpdateTipeHargaDto) { return this.service.update(+id, dto); }

  @Delete(':id')
  @RequirePermission('tipe-harga:write')
  remove(@Param('id') id: string) { return this.service.remove(+id); }
}