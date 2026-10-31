import { Controller, Get, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProdukInService } from './produk-in.service';
import { CreateProdukInDto } from './dto/produk-in.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

@ApiTags('Transaksi - Unloading (Produk In)')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/produk-in')
export class ProdukInController {
  constructor(private readonly produkInService: ProdukInService) {}

  @Post()
  @RequirePermission('produk-in:create')
  @UseInterceptors(IdempotencyInterceptor)

  create(
    @Body() dto: CreateProdukInDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.produkInService.create(dto, user.id, '127.0.0.1');
  }

  @Get()
  @RequirePermission('produk-in:read')
  findAll() {
    return this.produkInService.findAll();
  }
}