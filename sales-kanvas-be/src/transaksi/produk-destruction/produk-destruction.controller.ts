import { Controller, Get, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProdukDestructionService } from './produk-destruction.service';
import { CreateDestructionDto } from './dto/produk-destruction.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

@ApiTags('Transaksi - Disposal Barang')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/produk-destruction')
export class ProdukDestructionController {
  constructor(private readonly service: ProdukDestructionService) {}

  @Post()
  @RequirePermission('retur:create') 
  @UseInterceptors(IdempotencyInterceptor)
  create(@Body() dto: CreateDestructionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id, '127.0.0.1');
  }

  @Get()
  @RequirePermission('retur:read')
  findAll() {
    return this.service.findAll();
  }
}