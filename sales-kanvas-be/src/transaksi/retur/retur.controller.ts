import { Controller, Get, Post, Body, UseGuards, UseInterceptors, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReturService } from './retur.service';
import { CreateReturDto } from './dto/retur.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

@ApiTags('Transaksi - Retur')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/retur')
export class ReturController {
  constructor(private readonly returService: ReturService) {}

  @Post()
  @RequirePermission('retur:create')
  @UseInterceptors(IdempotencyInterceptor)
  create(@Body() dto: CreateReturDto, @CurrentUser() user: AuthenticatedUser) {
    return this.returService.create(dto, user);
  }

  @Patch(':id/approve')
  // ✅ PERBAIKAN: Gunakan permission 'retur:approve' (atau 'retur:write' jika belum ada)
  // Pastikan role Sales TIDAK memiliki permission ini di database
  @RequirePermission('retur:approve') 
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.returService.approve(+id, user);
  }

  @Get()
  @RequirePermission('retur:read')
  findAll() {
    return this.returService.findAll();
  }
}