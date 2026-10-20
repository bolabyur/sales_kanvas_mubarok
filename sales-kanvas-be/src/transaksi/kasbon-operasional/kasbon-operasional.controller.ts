import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KasbonOperasionalService } from './kasbon-operasional.service';
import { CreateKasbonOperasionalDto } from './dto/kasbon-operasional.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Transaksi - Kasbon Operasional')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/kasbon-operasional')
export class KasbonOperasionalController {
  constructor(private readonly kasbonOperasionalService: KasbonOperasionalService) {}

  @Post()
  @RequirePermission('kasbon-operasional:write')
  create(@Body() dto: CreateKasbonOperasionalDto) {
    return this.kasbonOperasionalService.create(dto);
  }

  @Get()
  @RequirePermission('kasbon-operasional:read')
  findAll() {
    return this.kasbonOperasionalService.findAll();
  }
}