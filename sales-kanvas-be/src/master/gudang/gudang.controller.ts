import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GudangService } from './gudang.service';
import { CreateGudangDto, UpdateGudangDto } from './dto/gudang.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Master - Gudang')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('master/gudang')
export class GudangController {
  constructor(private readonly gudangService: GudangService) {}

  @Get()
  @RequirePermission('gudang:read')
  findAll() { return this.gudangService.findAll(); }

  @Get(':id')
  @RequirePermission('gudang:read')
  findOne(@Param('id') id: string) { return this.gudangService.findOne(+id); }

  @Post()
  @RequirePermission('gudang:write')
  create(@Body() dto: CreateGudangDto) { return this.gudangService.create(dto); }

  @Patch(':id')
  @RequirePermission('gudang:write')
  update(@Param('id') id: string, @Body() dto: UpdateGudangDto) { return this.gudangService.update(+id, dto); }

  @Delete(':id')
  @RequirePermission('gudang:write')
  remove(@Param('id') id: string) { return this.gudangService.remove(+id); }
}