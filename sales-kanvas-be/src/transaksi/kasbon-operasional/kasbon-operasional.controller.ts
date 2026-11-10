import { Controller, Get, Post, Body, Patch, Param, UseGuards, Headers, Req, UseInterceptors } from '@nestjs/common';
import { KasbonOperasionalService } from './kasbon-operasional.service';
import { CreateKasbonOperasionalDto } from './dto/kasbon-operasional.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

@Controller('transaksi/kasbon-operasional')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class KasbonOperasionalController {
  constructor(private readonly kasbonOperasionalService: KasbonOperasionalService) {}

  @Post()
  @RequirePermission('kasbon-operasional:create')
  @UseInterceptors(IdempotencyInterceptor)
  create(
    @Body() dto: CreateKasbonOperasionalDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.kasbonOperasionalService.create(dto, user.id, '127.0.0.1', idempotencyKey);
  }

  @Get()
  @RequirePermission('kasbon-operasional:read')
  findAll() {
    return this.kasbonOperasionalService.findAll();
  }

  @Patch(':id/update-status')
  @RequirePermission('kasbon-operasional:update')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.kasbonOperasionalService.updateStatus(+id, dto.status, user.id, '127.0.0.1');
  }
}