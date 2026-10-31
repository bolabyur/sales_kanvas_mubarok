import { Controller, Get, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PembayaranService } from './pembayaran.service';
import { CreatePembayaranDto } from './dto/pembayaran.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

@ApiTags('Transaksi - Pembayaran')
@ApiBearerAuth('access-token')

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/pembayaran')
export class PembayaranController {
  constructor(private readonly pembayaranService: PembayaranService) {}

  @Post()
  @RequirePermission('pembayaran:write')
  @UseInterceptors(IdempotencyInterceptor)
  create(
    @Body() dto: CreatePembayaranDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pembayaranService.create(dto, user);
  }

  @Get()
  @RequirePermission('pembayaran:read')
  findAll() {
    return this.pembayaranService.findAll();
  }
}